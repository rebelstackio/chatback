var config = {
	apiKey: "AIzaSyBMB9rO2BtIaRmt6SH8sakZyE02CibIb-8",
	authDomain: "rebelstackchat.firebaseapp.com",
	databaseURL: "https://rebelstackchat.firebaseio.com",
	storageBucket: "rebelstackchat.appspot.com",
	messagingSenderId: "209932179940"
};

var firebaseHelper = {};

firebaseHelper.HISTORY_MESSAGE_QTY = 10;

firebaseHelper.SERVER_SOURCE = "SERVER";

/**
 * _init - Init firebase configuration and set up the client credentials locally
 *
 * @return {Promise}	Firebase Promise
 */
firebaseHelper.init = function _init(){
	//INIT FIREBASE CONFIGURATION
	firebase.initializeApp(config);
}


/**
 * _updateUser - Event when there is a new user added
 *
 * @param  {function} next callback
 */
firebaseHelper.updateUser = function _updateUser(next){
	var clientsRef = firebase.database().ref('clients').orderByChild('-lastActivity');
	clientsRef.on('child_added', function(data) {
		next(data);
	});

	clientsRef.on('child_changed', function(data) {
		next(data);
	});
}


/**
 * _getMessageByUserId - Get message by user ID
 *
 * @param  {string} id  User ID
 * @return {Promise}    Firebase Promise
 */
firebaseHelper.getMessageByUserId = function _getMessageByUserId(id){
	var path = '/messages/' + id  +'/';
	return firebase.database().ref(path).orderByChild('createdAt').limitToLast(firebaseHelper.HISTORY_MESSAGE_QTY).once('value');
}

/**
 * sendServerMessage - Send the message to the server
 *
 * @param  {string}  message Message descriptions
 * @return {Promise}         FirebasePromise
 */
firebaseHelper.sendServerMessage = function _sendServerMessage(message, id){
	var path = '/messages/' + id + '/';
	var updates = {};

	var newMessage = {
		createdAt: firebase.database.ServerValue.TIMESTAMP,
		message: message,
		read: false,
		source: firebaseHelper.SERVER_SOURCE
	};

	var newMessageKey = firebase.database().ref().child(path).push().key;
	path += newMessageKey;
	updates[path] = newMessage;
	return firebase.database().ref().update(updates);
}

/**
 * _newServeMessage - new message from server
 *
 * @param  {function} next Callback
 */
firebaseHelper.newClientMessage = function _newClientMessage(id, next){
	var path = '/messages/' + id  +'/';
	var messagesRef = firebase.database().ref(path).orderByChild('createdAt');
	messagesRef.on('child_added', function(data) {
		next(data);
	});
}
