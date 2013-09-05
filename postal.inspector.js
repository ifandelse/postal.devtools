var viewer = document.querySelector( ".viewer" );
var messages = document.getElementById( "messages" );
var $messages = $( messages );
var $logSize = $( "#log-size" );
var $details = $( ".details" );
var $dataPre = $( "#data-pre" );
var $envPre = $( "#envelope-pre" );
var height;
var log = [];
var prev;
var port = chrome.runtime.connect({ name: "postal.inspector.js" });

port.onMessage.addListener(function(msg, sender, sendResponse) {
	//setTimeout(function() { alert('onMessage event in postal.inspector.js'); }, 0);
	var line;
	if(msg.type === "postal.inspector" && msg.hasOwnProperty("envelope")) {
		var _atBottom = atBottom();
		line = msg.envelope;
		log.push( line );
		var html = "<li data-index='" + (log.length - 1) + "'><span class='channel'>" + line.channel + "</span><span class='topic'>" + line.topic + "</span></li>";
		$messages.append( html );
		$logSize.text( log.length );
		if ( _atBottom ) {
			viewer.scrollTop = viewer.scrollHeight - height;
		}
	} else if (msg.type === "postal.inspector" && msg.cmd === "content_script_connect") {
		clear();
	}
});

function atBottom() {
	height = viewer.clientHeight;
	var scrollHeight = viewer.scrollHeight;
	return scrollHeight === height || viewer.scrollTop + height + 10 >= scrollHeight;
}

function select( log ) {
	if ( log === null ) {
		if ( prev ) {
			prev.removeClass( "selected" );
			prev = null;
		}

		$details.hide();
		return;
	}
	$dataPre.html( JSON.stringify( log.data, null, "  " ) );
	var envCopy = {};
	for ( var prop in log ) {
		if ( prop !== "data" ) {
			envCopy[ prop ] = log[ prop ];
		} else {
			envCopy.data = "...";
		}
	}
	$envPre.html( JSON.stringify( envCopy, null, "  " ) );
	$details.show();
}

function clear () {
	select( null );
	log.length = 0;
	$logSize.text( log.length );
	messages.innerHTML = "";
}

document.getElementById( 'clear' ).addEventListener( "click", clear, false );

$( document ).on( "click", ".details .close", function () {
	select( null );
});

$( messages ).on( "click", "li", function ( e ) {
	if ( prev ) {
		prev.removeClass( "selected" );
	}
	prev = $( e.currentTarget ).addClass( "selected" );
	var item = log[ parseInt( prev.data( "index" ), 10 ) ];
	select( item );
});