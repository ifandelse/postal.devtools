// synchronous alerts cause wacky things
// to happen inside chrome extension scripts
function alertify(msg) {
	setTimeout(function(){
		alert(msg);
	}, 0);
}
var port;

var codeToEval = '(function( global, undefined ) {'
+ 'var timeout, wiretapped, idx = 0, INSPECTOR = "postal.inspector";'
//+ 'alert( "eval occurred" );'
+ 'var addWireTap = function( p ) {'
+ '	if(!global.__postalInspector__) {'
//+ '		alert( "adding wiretap" );'
+ '		global.__postalInspector__ = true;'
+ '		p.addWireTap( function( d, e ) {'
+ '			global.postMessage( { '
+ '				channel  : INSPECTOR,'
+ '				topic    : "wiretap.item",'
+ '				envelope : e'
+ '			}, "*" );'
+ '		} );'
+ '	} else {'
//+ '		alert( "wiretap already present" );'
+ '	}'
+ '}; '
+ 'if ( global.postal ) {'
+ '	addWireTap( global.postal );'
+ '} else {'
+ '	if ( !global.hasOwnProperty( "__postalReady__" ) ) {'
+ '		global.__postalReady__ = [ { source: INSPECTOR, onReady: addWireTap } ];'
+ '	} else { '
+ '		while(idx < global.__postalReady__.length) { '
+ '			if(global.__postalReady__[idx].source === INSPECTOR) {'
+ '				wiretapped = true;'
+ '				break;'
+ '			}'
+ '			idx++;'
+ '		}'
+ '		if(!wiretapped) {'
+ '			global.__postalReady__.push( { source: INSPECTOR, onReady: addWireTap } );'
+ '		}'
+ '	}'
+ '}'
+ 'return true;'
+ '}( window ));';

function injectWireTap() {
	chrome.devtools.inspectedWindow.eval( codeToEval, function() {} );
}

port = chrome.runtime.connect({ name: "devtools.js" });

port.onMessage.addListener( function( msg, sender, sendResponse ) {
	injectWireTap();
	//alertify( "{port} onMessage event inside devtools.js " + JSON.stringify( msg, null, 2 ) );
});

chrome.devtools.panels.create(
	"Postal.js",
	"devtools-icon.png",
	"postal.inspector.html",
	function(panel) {
		//alertify(JSON.stringify(Object.keys(panel), null, 2));
		injectWireTap();
		/*panel.onShown.addListener(function(){
			chrome.runtime.sendMessage({ type: "postal.inspector", cmd: "dev_panel_shown", dtPort: port.portId_ });
		});*/
	}
);


/*
// the eval'd script sent to the client:
(function( global, undefined ) {
	var timeout, wiretapped, idx = 0, INSPECTOR = "postal.inspector";
	var addWireTap = function( p ) {
		if(!global.__postalInspector__) {
			global.__postalInspector__ = true;
			p.addWireTap( function( d, e ) {
				global.postMessage( {
					channel  : INSPECTOR,
					topic    : "wiretap.item",
					envelope : e
				}, "*" );
			} );
		} else {
			//alert( "wiretap already present" );
		}
	};
	if ( global.postal ) {
		addWireTap( global.postal );
	} else {
		if ( !global.hasOwnProperty( "__postalReady__" ) ) {
			global.__postalReady__ = [ { source: INSPECTOR, onReady: addWireTap } ];
		} else {
			while(idx < global.__postalReady__.length) {
				if(global.__postalReady__[idx].source === INSPECTOR) {
					wiretapped = true;
					break;
				}
				idx++;
			}
			if(!wiretapped) {
				global.__postalReady__.push( { source: INSPECTOR, onReady: addWireTap } );
			}
		}
	}
	return true;
}( window ));*/
