window.addEventListener( "message", function ( event ) {
	//console.log(event.data);
	if ( event.source == window && event.data && event.data.type === "postal.inspector") {
		chrome.runtime.sendMessage( event.data );
	}
}, false );

var port = chrome.runtime.connect({ name: "pi_content.js" });