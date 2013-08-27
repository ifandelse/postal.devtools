var codeToEval = '(function(global, undefined) { '
	                 + '	var timeout; '
	                 + '	var addWireTap = function(p) { '
	                 + '		p.addWireTap(function(d,e) { '
	                 + '			global.postMessage({ type: "postal.inspector", envelope: e }, "*"); '
	                 + '		}); '
	                 + '	}; '
	                 + '	var signalNoGo = function() { '
	                 + '		console.log("postal.js inspector: Unable to add wiretap - postal.js is not present."); '
	                 + '	}; '
	                 + '	if(global.postal) {  '
	                 + '		addWireTap(global.postal);  '
	                 + '	} else {  '
	                 + '		/* Are we in an AMD environment?  */'
	                 + '		if ( typeof define === "function" && define.amd && typeof require === "function") { '
	                 + '			timeout = setTimeout(function() { signalNoGo(); }, 5000);'
	                 + '			require(["postal"], function(postal) {  '
	                 + '				try {  '
	                 + '					clearTimeout(timeout); '
	                 + '					addWireTap(postal); '
	                 + '				} catch(e) {  '
	                 + '					signalNoGo();  '
	                 + '				}  '
	                 + '			});   '
	                 + '		} else {  '
	                 + '			signalNoGo();  '
	                 + '		}  '
	                 + '	}  '
	                 + '    return true;'
	+ '}(window)); ';
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