window.addEventListener( "message", function ( event ) {
	if ( event.source == window && event.data && event.data.channel === "postal.inspector" && event.data.topic === "wiretap.item") {
		chrome.runtime.sendMessage( event.data );
	}
}, false );

var port = chrome.runtime.connect({ name: "pi_content.js" });
