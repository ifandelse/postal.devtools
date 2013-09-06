// synchronous alerts cause wacky things
// to happen inside chrome extension scripts
function alertify(msg) {
	setTimeout(function(){
		alert(msg);
	}, 0);
}

var tabs = {};
var activeTabId;
var purgeQueue = function(tabId) {
	tabId = tabId || activeTabId;
	if(tabId && tabs.hasOwnProperty(tabId) && tabs[tabId].hasOwnProperty("postal.inspector.js")) {
		while(tabs[tabId].queue.length) {
			tabs[tabId]["postal.inspector.js"].postMessage(tabs[tabId].queue.shift(), "*");
		}
	}
};

var ensureTabSession = function(port) {
	var tabId = (port.sender && port.sender.tab && port.sender.tab.id) || activeTabId;
	//alertify("Background ensuring session for tab: " + tabId);
	if(!tabs.hasOwnProperty(tabId)) {
		tabs[tabId] = { tabId: tabId,  queue: [] };
	}
	return tabs[tabId];
};

var onConnectActions = {
	"devtools.js" : function(port) {
		//alertify("devtools.js connected to bg - " + port.portId_);
		var session = ensureTabSession(port);
		session["devtools.js"] = port;
		port.onDisconnect.addListener(function() {
			session["devtools.js"] = undefined;
		});
	},
	"postal.inspector.js" : function(port) {
		//alertify("postal.inspector.js connected to bg");
		var session = ensureTabSession(port);
		session["postal.inspector.js"] = port;
		port.onDisconnect.addListener(function() {
			session["postal.inspector.js"] = undefined;
		});
		purgeQueue(session.tabId);
	},
	"pi_content.js" : function(port) {
		//alertify("pi_content.js connected to bg");
		var session = ensureTabSession(port);
		session["pi_content.js"] = port;
		port.onDisconnect.addListener(function(){
			session["pi_content.js"].port = undefined;
		});
		activeTabId = activeTabId || tabId;
	}
};

var port = chrome.runtime.connect({ name: "background.js" });

var analyzeEnvelope = function(env) {
	return {
		channel: "postal.inspector",
		topic  : "analyzed.envelope",
		data   : env
	}
};

var behaviors = {
	"wiretap.item" : function( msg, sender, sendResponse ) {
		var tabId = sender.tab.id;
		if( tabs.hasOwnProperty(tabId) && tabs[tabId]["postal.inspector.js"] ) {
			tabs[tabId]["postal.inspector.js"].postMessage(analyzeEnvelope(msg.envelope));
			//alertify('SENT VIA PORT - onMessage event in background.js');
		} else {
			tabs[tabId].queue.push(analyzeEnvelope(msg.envelope));
			//alertify('QUEUED - onMessage event in background.js, tabId: ' + activeTabId);
		}
	}
};

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
	//alertify('onMessage event in background.js : ' + JSON.stringify(msg, null, 2));
	if(msg.channel === "postal.inspector" && msg.topic && behaviors.hasOwnProperty(msg.topic)) {
		behaviors[msg.topic](msg, sender, sendResponse);
	}
});

chrome.runtime.onConnect.addListener(function(p){
	if(onConnectActions.hasOwnProperty( p.name )) {
		onConnectActions[p.name](p);
	}
});

chrome.tabs.onActivated.addListener(function(info){
	activeTabId = info.tabId;
	var session = ensureTabSession(activeTabId);
	purgeQueue(activeTabId);
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
	switch(changeInfo.status) {
		case 'complete' :
			tabs[tabId]["devtools.js"].postMessage({
				channel: "postal.inspector",
				topic  : "tab.updated",
				data   : { tabId : tabId, contentPort: tabs[tabId]["pi_content.js"].portId_ }
			}, "*");
		break;
		default :
			tabs[tabId]["postal.inspector.js"].postMessage({
				channel: "postal.inspector",
				topic  : "tab.updating",
				data   : { tabId : tabId, contentPort: tabs[tabId]["pi_content.js"].portId_ }
			}, "*");
		break;
	}
});


/*
// for my own reference, connecting ports expose the following:
 var obj = {};
 obj.portId_     = port.portId_;
 obj.name        = port.name;
 obj.senderId    = port.sender.id;
 obj.senderUrl   = port.sender.url;
 obj.tabId       = port.sender.tab.id;
 obj.tabActive   = port.sender.tab.active;
 obj.tabWindowId = port.sender.tab.windowId;
 obj.tabStatus   = port.sender.tab.status;

 */
