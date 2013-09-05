var ports ={};
var queue = [];
var PANEL_TARGET = "postal.inspector.js";
var onConnectActions = {
	"postal.inspector.js" : function(port) {
		while(queue.length) {
			port.postMessage(queue.shift());
		}
	},
	"pi_content.js" : function(port) {
		/*var obj = {};
		obj.portId_ = port.portId_;
		obj.name = port.name;
		obj.senderId = port.sender.id;
		obj.senderUrl = port.sender.url;
		obj.tabId = port.sender.tab.id;
		obj.tabActive = port.sender.tab.active;
		obj.tabWindowId = port.sender.tab.windowId;
		obj.tabStatus = port.sender.tab.status;

		setTimeout(function() { alert("Tab: " + JSON.stringify(obj, null, 2) ); }, 0);*/
		if(ports.hasOwnProperty("devtools.js")) {
			ports["devtools.js"].postMessage({
				type: "postal.inspector",
				cmd : "content_script_connect"
			}, "*");
		}
		if(ports.hasOwnProperty("postal.inspector.js")) {
			ports["postal.inspector.js"].postMessage({
				type: "postal.inspector",
				cmd : "content_script_connect"
			}, "*");
		}
	}
};

var port = chrome.runtime.connect({ name: "background.js" });

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
	if(!ports.hasOwnProperty(PANEL_TARGET)) {
		queue.push(msg);
		//setTimeout(function() { alert('QUEUED - onMessage event in background.js'); }, 0);
	} else {
		//setTimeout(function() { alert('SENT VIA PORT - onMessage event in background.js'); }, 0);
		ports[PANEL_TARGET].postMessage(msg);
	}
});

chrome.runtime.onConnect.addListener(function(p){
	ports[p.name] = p;
	//p.onDisconnect.addListener(getDisconnectHandler( p.name ));
	if(onConnectActions.hasOwnProperty( p.name )) {
		onConnectActions[p.name](p);
	}
	//setTimeout(function() { alert('**onConnect event in background.js -> ' + p.name); }, 0);
});