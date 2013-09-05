var codeToEval = '(function (global, undefined) {'
				+ ' var timeout;'
				+ ' var addWireTap = function (p) {'
				+ '	    p.addWireTap(function (d, e) {'
				+ '		    global.postMessage({'
				+ '			    type: "postal.inspector",'
				+ '			    envelope: e'
				+ '		    }, "*");'
				+ '	    });'
				+ ' };'
				+ ' if (global.postal) {'
				+ '  addWireTap(global.postal);'
				+ ' } else {'
				+ '  if(!global.hasOwnProperty("__postalReady__")) {'
				+ ' 		global.__postalReady__ = [];'
				+ ' 	}'
				+ '  global.__postalReady__.push(addWireTap);'
				+ ' }'
				+ ' return true;'
				+ '}(window));';
var port;

function injectWireTap() {
	chrome.devtools.inspectedWindow.eval( codeToEval, function() {} );
}

chrome.devtools.panels.create(
	"Postal.js",
	"devtools-icon.png",
	"postal.inspector.html",
	function(panel) {
		port = chrome.runtime.connect({ name: "devtools.js" });
		port.onMessage.addListener(function(msg, sender, sendResponse){
			if(msg.type === "postal.inspector" && msg.cmd === "content_script_connect") {
				//setTimeout(function() { alert( 'about to inject content script due to connection' ); }, 0);
				injectWireTap();
			}
		});
		injectWireTap();
		//setTimeout(function() { alert( 'postal tab created' ); }, 0);
	}
);