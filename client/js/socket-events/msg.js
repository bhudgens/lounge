"use strict";

const $ = require("jquery");
const socket = require("../socket");
const render = require("../render");
const chat = $("#chat");

socket.on("msg", function(data) {
	if (window.requestIdleCallback) {
		// During an idle period the user agent will run idle callbacks in FIFO order
		// until either the idle period ends or there are no more idle callbacks eligible to be run.
		// We set a maximum timeout of 2 seconds so that messages don't take too long to appear.
		window.requestIdleCallback(() => processReceivedMessage(data), {timeout: 2000});
	} else {
		processReceivedMessage(data);
	}
});

function processReceivedMessage(data) {
	let targetId = data.chan;
	let target = "#chan-" + targetId;
	let channel = chat.find(target);

	// Display received notices and errors in currently active channel,
	// if the actual target is the network lobby.
	// Reloading the page will put them back into the lobby window.
	if (data.msg.showInActive) {
		targetId = data.chan = chat.find(".active").data("id");
		target = "#chan-" + targetId;
		channel = chat.find(target);
	}

	const container = channel.find(".messages");
	const activeChannelId = chat.find(".chan.active").data("id");

	if (data.msg.type === "channel_list" || data.msg.type === "ban_list") {
		$(container).empty();
	}

	// Add message to the container
	render.appendMessage(
		container,
		targetId,
		$(target).attr("data-type"),
		data.msg
	);

	container.trigger("msg", [
		target,
		data
	]).trigger("keepToBottom");

	var lastVisible = container.find("div:visible").last();
	if (data.msg.self
		|| lastVisible.hasClass("unread-marker")
		|| (lastVisible.hasClass("date-marker")
		&& lastVisible.prev().hasClass("unread-marker"))) {
		container
			.find(".unread-marker")
			.appendTo(container);
	}

	// Message arrived in a non active channel, trim it to 100 messages
	if (activeChannelId !== targetId && container.find(".msg").slice(0, -100).remove().length) {
		channel.find(".show-more").addClass("show");

		// Remove date-separators that would otherwise
		// be "stuck" at the top of the channel
		channel.find(".date-marker-container").each(function() {
			if ($(this).next().hasClass("date-marker-container")) {
				$(this).remove();
			}
		});
	}

	if ((data.msg.type === "message" || data.msg.type === "action") && channel.hasClass("channel")) {
		const nicks = channel.find(".users").data("nicks");
		if (nicks) {
			const find = nicks.indexOf(data.msg.from);
			if (find !== -1) {
				nicks.splice(find, 1);
				nicks.unshift(data.msg.from);
			}
		}
	}
}
