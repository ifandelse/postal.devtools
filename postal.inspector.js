// synchronous alerts cause wacky things
// to happen inside chrome extension scripts
function alertify(msg) {
	setTimeout(function(){
		alert(msg);
	}, 0);
}
var preserveLog  = true;
var viewer       = document.querySelector( ".viewer" );
var messages     = document.getElementById( "messages" );
var $messages    = $( messages );
var $logSize     = $( "#log-size" );
var $details     = $( ".details" );
var $dataPre     = $( "#data-pre" );
var $envPre      = $( "#envelope-pre" );
var $preserveLog = $( "#preserve" );
var height;
var log = [];
var prev;
var port = chrome.runtime.connect({ name: "postal.inspector.js" });
var behaviors = {
	"analyzed.envelope" : function(msg, sender, sendResponse) {
		var _atBottom = atBottom();
		var line = msg.data;
		log.push( line );
		var html = "<li data-index='" + (log.length - 1) + "'><span class='channel'>" + line.channel + "</span><span class='topic'>" + line.topic + "</span></li>";
		$messages.append( html );
		$logSize.text( log.length );
		if ( _atBottom ) {
			viewer.scrollTop = viewer.scrollHeight - height;
		}
	},
	"tab.updating" : function(msg) {
		//alertify("Tab change notice in postal.inspector.js: " + JSON.stringify(msg.data, null, 2));
		if(!preserveLog) {
			clear();
		}
	},
	"content.script.connect" : function(msg, sender, sendResponse) {
		//alertify("content script connect inside postal.inspector.js: " + JSON.stringify(msg, null, 2));
		//clear();
	},
	"dev.panel.shown" : function(msg, sender, sendResponse) {
		//setTimeout(function() { alert("Dev Panel Shown notice in postal.inspector.js. Port ID: " + port.portId_); }, 0);
	}
};

chrome.runtime.onConnect.addListener(function(p) {
	alertify('onConnect event in postal.inspector.js - ' + p.name);
});

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse){
	if(msg.channel === "postal.inspector" && msg.topic && behaviors.hasOwnProperty(msg.topic)) {
		behaviors[msg.topic]( msg, sender, sendResponse );
	}
});

port.onMessage.addListener(function(msg, sender, sendResponse) {
	if(msg.channel === "postal.inspector" && msg.topic && behaviors.hasOwnProperty(msg.topic)) {
		behaviors[msg.topic]( msg, sender, sendResponse );
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

$preserveLog.on("change", function() {
	preserveLog = $preserveLog.is(":checked");
});