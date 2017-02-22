var config = {
	apiKey: "AIzaSyBMB9rO2BtIaRmt6SH8sakZyE02CibIb-8",
	authDomain: "rebelstackchat.firebaseapp.com",
	databaseURL: "https://rebelstackchat.firebaseio.com",
	storageBucket: "rebelstackchat.appspot.com",
	messagingSenderId: "209932179940"
};

var firebaseHelper = {};

firebaseHelper.HISTORY_MESSAGE_QTY = 10;

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
 * _newUserClick - Event when there is a new user added
 *
 * @param  {function} next callback
 */
firebaseHelper.newUserClick = function _newUserClick(next){
	var clientsRef = firebase.database().ref('clients').orderByChild('-lastActivity');
	clientsRef.on('child_added', function(data) {
		next(data);
	});

	clientsRef.on('child_changed', function(data) {
		next(data);
	});
}

firebaseHelper.getMessageByUserId = function _getMessageByUserId(id){
	var path = '/messages/' + id  +'/';
	return firebase.database().ref(path).orderByChild('createdAt').limitToLast(firebaseHelper.HISTORY_MESSAGE_QTY).once('value');
}
