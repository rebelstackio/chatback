/**
 * Chat	class
 * @author jegj
 */
var Chat = {	};


Chat.FOCUS_ID = null;

Chat.FOCUS_NAME = null;

Chat.FOCUS_EMAIL = null;

Chat.SEND_MESSAGE_KEY = 13;
/**
 * _init - Init Chat component
 */
Chat.init = function _init(){
	Chat.buildContactList();
	Chat.createChatZoneMessage();
}

Chat.buildContactList = function _buildContactList(){
	// 	<div class="row chats-row">
	// 		<div class="col-md-12">
	// 				<a href="#" class="list-group-item active">
	// 					jegj57@gmail.com
	// 				</a>
	// 		</div>
	// 	</div>

	var chatContainer = document.getElementById('contact-list');

	var container = document.createElement('div');
	container.setAttribute('class', 'col-md-3 contact-list');

	var row = document.createElement('div');
	row.setAttribute('class', 'row chats-row');

	//CREATE CONTACT LIST TITLE
	var titleContainer = document.createElement('div');
	titleContainer.setAttribute('class', 'col-md-12');
	titleContainer.setAttribute('style', 'text-align: center;');
	var h4 = document.createElement('h4');
	h4.setAttribute('class', 'chat-title')
	var text = document.createTextNode('Contact List');
	h4.appendChild(text);
	titleContainer.appendChild(h4);
	row.appendChild(titleContainer);

	//CREATE CONTACT-LIST CONTAINER
	var col = document.createElement('div');
	col.setAttribute('class', 'col-md-12');
	col.setAttribute('id', 'users-col');

	//CREATE SPINNER
	var spinner = Chat.createSpinner('Loading users');
	col.appendChild(spinner);

	row.appendChild(col);
	chatContainer.appendChild(row);

	$( spinner ).fadeIn( "slow" );
}


/**
 * _createUserComponent - Create client list component
 *
 * @param  {Object} userObj User object
 * @param  {string} userId  User ID
 */
Chat.createUserComponent = function _createUserComponent (userObj,  userId) {
	var col = document.getElementById('users-col');
	//CHECKING IF THE SPINNER IS ACTIVE
	var spinner = col.getElementsByClassName('wrap');
	if ( spinner && spinner.length ){
		col.innerHTML = "";
	}

	var previousClients = document.getElementsByClassName('list-group-item');
	var previousClientsLength = previousClients.length;
	var added = false;
	if ( previousClientsLength ){
		for (var i = 0; i < previousClientsLength; i++) {
			var id = previousClients[i].getAttribute('data-id');
			if (id == userId){
				added = true;
			}
		}
	}

	if ( userObj.email && !added){
		var userLink = document.createElement('a');
		userLink.setAttribute('href', '#');
		userLink.setAttribute('class', 'list-group-item');
		userLink.setAttribute('style', 'display:none;');
		userLink.setAttribute('id', 'link' + userId);
		userLink.setAttribute('data-id',	userId);
		userLink.setAttribute('data-name',	userObj.name);
		userLink.setAttribute('data-email',	userObj.email);
		userLink.setAttribute('data-lastActivity',	userObj.lastActivity);
		userLink.addEventListener( 'click', Chat.userClickEvent);
		var text = document.createTextNode(userObj.email);
		userLink.appendChild(text);
		col.appendChild(userLink);

		$(userLink).fadeIn('slow');
	}

	if ( added ) {
		if ( Chat.FOCUS_ID !=  userId) {
			var link = document.getElementById('link' + userId);
			if ( link ){
				link.className += ' highlight-contact-list';
			}
		}
	}
}


/**
 * _userClickEvent - Event trigger by user
 *
 * @param  {object} event Event Object
 */
Chat.userClickEvent = function _userClickEvent(event){
	var domElement = event.target;
	var id = domElement.getAttribute('data-id');
	Chat.FOCUS_ID = id;
	Chat.FOCUS_NAME = domElement.getAttribute('data-name');
	Chat.FOCUS_EMAIL = domElement.getAttribute('data-email');
	//TODO REMOVE ACTIVE CLASS FROM CONTACT LIST
	var link = document.getElementById('link' + id);
	if ( link ){
		link.classList.remove("highlight-contact-list");
	}
	firebaseHelper.newClientMessage(id, function(data){
		//NEW MEESAGE BELONGS TO THE CURRENT CHAT
		if ( id == Chat.FOCUS_ID ) {
			var message = data.val();
			if ( message && message['source'] == 'CLIENT' ){
				Chat.buildClientMessage(
					message['message'],
					message['createdAt'],
					message['read'],
					false,
					data.key
				);
			}
		}
	});
	firebaseHelper.getMessageByUserId(id).then(function(data){
		if ( data.val()){
			Chat.createMessageZoneByUserMessages();
			Chat.buildPreviousConversation(data.val());
		} else {
			Chat.createChatZoneMessage();
		}
	}).catch(function(error){
		Chat.createChatZoneMessage('There is a problem getting the messages', true);
		console.log('Error getting the messages', error);
	});
}


Chat.createMessageZoneByUserMessages = function _createMessageZoneByUserMessages(){
	//<div class="col-md-9 current-chat">
	var chatContainer = document.getElementById('current-chat');
	chatContainer.innerHTML = "";

	var chatDiv = document.createElement('div');
	chatDiv.setAttribute('class', 'chat');
	chatDiv.setAttribute('id', 'chat-container');
	chatDiv.setAttribute('style', 'display:none;');

	var chatHistoryDiv = document.createElement('div');
	chatHistoryDiv.setAttribute('class', 'chat-history');
	chatHistoryDiv.setAttribute('id', 'chat-history');

	var messageZone = Chat.buildMessageZone();

	var chatUl = document.createElement('ul');
	chatUl.setAttribute('class', 'chat-ul');
	chatUl.setAttribute('id', 'chat-list');

	chatHistoryDiv.appendChild(chatUl);
	chatDiv.appendChild(chatHistoryDiv);
	chatDiv.appendChild(messageZone);

	chatContainer.appendChild(chatDiv);

	//FOCUS
	messageZone.focus();

	//UGG JQUERY
	$( "#chat-container" ).fadeIn( "slow" );

}

Chat.buildMessageZone = function _buildMessageZone(){
	var message = document.createElement('textarea');
	message.setAttribute('class', 'form-control message-zone');
	message.setAttribute('id', 'message-zone');
	message.setAttribute('name', 'message-zone');
	message.setAttribute('placeholder', 'Message');
	message.setAttribute('rows', '2');
	message.setAttribute('required', 'required');

	message.addEventListener('focus', function(event){
		var newMessages = document.getElementsByClassName('fa-envelope');
		var newMessagesLengh = newMessages.length;
		var index = 0;
		while (index < newMessagesLengh) {
			newMessages[0].className = "fa fa-circle me";
			index++;
		}
	});

	message.addEventListener('keypress', function(event){
		var key = event.keyCode;
		if (key === Chat.SEND_MESSAGE_KEY){
			event.preventDefault();
			var message = event.target.value;
			event.target.value = "";
			Chat.sendServerMessage(message);
		}
	});
	return message;
}

 /**
  * _updateUser - Add the new user to the list
  *
  * @param  {object} user User Object
  */
Chat.updateUser = function _updateUser(user){
	if ( user && user.val()){
		Chat.createUserComponent(user.val(), user.key);
		Chat.sortUsersByActivity();
	}
}

/**
 * _sortUsersByActivity - Sort the users base on lastActivity
 *
 */
Chat.sortUsersByActivity = function _sortUsersByActivity(){
	var wrapper =	document.getElementById('users-col');
	var userLinks = wrapper.getElementsByClassName('list-group-item');

	var sorted	= Array.prototype.sort.call(userLinks, function(a, b) {
		return new Date(b.getAttribute('data-lastActivity')) - new Date(a.getAttribute('data-lastActivity'));
	});

	//TODO FIGURE OUT WHY THE SORT FUNCTION DOESN'T WORK
	for (var i = sorted.length -1 ; i >= 0; i--) {
		wrapper.appendChild(sorted[i]);
	}
}


Chat.buildPreviousConversation = function _buildPreviousConversation(messages){

	var keys = Object.keys(messages);
	var keyLength = keys.length;
	for (var i = 0; i < keyLength; i++) {
		var message = messages[keys[i]];
		switch (message['source']) {
			case 'CLIENT':
				Chat.buildClientMessage(
					message['message'],
					message['createdAt'],
					message['read'],
					false,
					keys[i]
				);
				break;

			case 'SERVER':
				Chat.buildServerMessage(
					message['message'],
					message['createdAt'],
					message['read'],
					false,
					keys[i]
				);
				break;
			default:
				console.log('Invalid message\'s source ', message);
				break;
		}
	}
}

/**
  * _sendClientMessage - Send the client message to firebase server
  *
  * @param  {type} message Message description
  * @param  {type} user    User object (OPTIONAL)
  * @return {type}         Firebase Promise
  */
Chat.sendServerMessage = function _sendServerMessage(message){
	var lastMessage = Chat.buildServerMessage(message, null, null, true);
	//TODO REMOVE SETTIMEOUT - JUST FOR TESTING
	setTimeout(function(){
		firebaseHelper.sendServerMessage(message, Chat.FOCUS_ID).then(function(){
			console.log('Message  has been sent to the client ');
			//CHANGE MESSAGE ICON TO SENT
			var icon = lastMessage.getElementsByClassName('fa-paper-plane')[0];
			icon.setAttribute('class', 'fa fa-circle you');
			icon.setAttribute('title', 'Message sent');
		}).catch(function(error){
			console.log('There is an error sending the meesage', error);
			//CHANGE MESSAGE ICON TO ERROR AND CHANGE CONTAINER'S  BG COLOR
			var messageContainer = lastMessage.getElementsByClassName('me-message')[0];
			messageContainer.setAttribute('class', 'message me-message-error');
			var iconContainer = lastMessage.getElementsByClassName('message-data-name')[0];
			var icon = iconContainer.getElementsByClassName('fa-paper-plane')[0];
			icon.setAttribute('class', 'fa fa-times me-error');
			icon.setAttribute('aria-hidden', 'true');
			icon.setAttribute('title', 'The message hasn\'t been sent');
		})
	}, 2000);
}

/**
  * _buildServerMessage - Build DOM elements from client's message
  *
  * @param  {string} 		message   Message descrition
  * @param  {timestamp} createdAt Message createdAt date
  * @param  {boolean} 	read      Meesage read by the rebel team
  * @param  {boolean} 	sending   Meesage is sending to the server
  */
Chat.buildServerMessage = function _buildServerMessage(message, createdAt, read, sending, id){
	// <li>
	// 	<div class="message-data">
	// 		<span class="message-data-name"><i class="fa fa-circle you"></i> You</span>
	// 	</div>
	// 	<div class="message you-message">
	// 		A new client?!?! I would love to help them, but where are we going to find the time?
	// 	</div>
	// </li>
	var messageContainer = document.createElement('li');
	if ( id ){
		messageContainer.setAttribute('id', 'message-container-' + id);
	}
	messageContainer.setAttribute('style', 'display:none;');
	var messageDataContainer = document.createElement('div');
	messageDataContainer.setAttribute('class', 'message-data');

	var messageDataTextContainer = document.createElement('span');
	messageDataTextContainer.setAttribute('class', 'message-data-name');

	var icon = document.createElement('i');

	//SENDING MESSAGE
	if ( sending ){
		icon.setAttribute('class', 'fa fa-paper-plane you faa-pulse animated');
		icon.setAttribute('aria-hidden', 'true');
		icon.setAttribute('title', 'Sending message');
	} else {
		icon.setAttribute('class', 'fa fa-circle you');
		icon.setAttribute('title', 'Message sent');
	}

	var strongText = document.createElement('strong');
	var messageDataText = document.createTextNode(' You - ');
	strongText.appendChild(messageDataText);

	var time = Chat.buildDateMessageFormat(createdAt);

	var messageTextContainer = document.createElement('div');
	messageTextContainer.setAttribute('class', 'message you-message');

	var _message = document.createTextNode(message);


	messageDataTextContainer.appendChild(icon);
	messageDataTextContainer.appendChild(strongText);
	messageDataTextContainer.appendChild(time);

	messageTextContainer.appendChild(_message);

	messageDataContainer.appendChild(messageDataTextContainer);
	messageDataContainer.appendChild(messageTextContainer);

	messageContainer.appendChild(messageDataContainer);

	//ADD TO DOM
	var chatList = document.getElementById('chat-list');
	chatList.appendChild(messageContainer);

	//UGG JQUERY
	$(messageContainer).fadeIn( "slow" );

	//LAST CLIENT MESSAGE
	Chat.LAST_CLIENT_MESSAGE = messageContainer;

	//FOCUS LAST MESSAGE
	Chat.focusLastMessageChat();

	return messageContainer;
}

/**
 * _buildServerMessage - Build DOM elements from server's message
 *
 * @param  {string} 		message   Message descrition
 * @param  {timestamp} 	createdAt Message createdAt date
 * @param  {boolean} 		read      Meesage read by the rebel team
 */
Chat.buildClientMessage = function _buildClientMessage(message, createdAt, read, sending, id){
	// var message = 'default chat message';
	// <li class="clearfix">
	// 	<div class="message-data align-right">
	// 		<span class="message-data-name">RebelStack </span> <i class="fa fa-circle me"></i>
	// 	</div>
	// 	<div class="message me-message float-right"> We should take a look at your onboarding and service delivery workflows, for most businesess there are many ways to save time and not compromise quality.	</div>
	// </li>

	var messageExists = document.getElementById('message-container-' + id);
	if ( !messageExists ) {
		var messageContainer = document.createElement('li');
		if ( id ){
			messageContainer.setAttribute('id', 'message-container-' + id);
		}
		messageContainer.setAttribute('style', 'display:none;');
		messageContainer.setAttribute('class', 'clearfix');
		var messageDataContainer = document.createElement('div');
		messageDataContainer.setAttribute('class', 'message-data align-right');

		var messageDataTextContainer = document.createElement('span');
		messageDataTextContainer.setAttribute('class', 'message-data-name');

		var icon = document.createElement('i');
		icon.setAttribute('class', 'fa fa-envelope me faa-pulse animated');

		var strongText = document.createElement('strong');

		var messageDataText = document.createTextNode(' '+ Chat.FOCUS_NAME + ' - ');
		strongText.appendChild(messageDataText);

		var time = Chat.buildDateMessageFormat(createdAt);

		var messageTextContainer = document.createElement('div');
		messageTextContainer.setAttribute('class', 'message me-message float-right');

		var _message = document.createTextNode(message);

		messageDataTextContainer.appendChild(icon);
		messageDataTextContainer.appendChild(strongText);
		messageDataTextContainer.appendChild(time);

		messageTextContainer.appendChild(_message);

		messageDataContainer.appendChild(messageDataTextContainer);
		messageDataContainer.appendChild(messageTextContainer);

		messageContainer.appendChild(messageDataContainer);

		//ADD TO DOM
		var chatList = document.getElementById('chat-list');
		//CHECK IF THE CONTAINER IS READY
		if ( chatList ){
			chatList.appendChild(messageContainer);

			//UGG JQUERY
			$(messageContainer).fadeIn( "slow" );

			//FOCUS LAST MESSAGE
			Chat.focusLastMessageChat();
		}
	}
}

/**
  * _buildDateMessageFormat - Build the date componenet next to the message label
  *
  * @param  {type} createdAt Message Created Date
  * @return {DOM} 					 Date component
  */
Chat.buildDateMessageFormat = function _buildDateMessageFormat(createdAt){
	var date;
	if ( createdAt ){
		date = new Date(createdAt);
	} else {
		date = new Date();
	}

	var options = {
	 	year: "numeric", month: "short",
		day: "numeric"
	};

	var strDate = date.toLocaleTimeString("en-us", options);
	var time = document.createTextNode(strDate);
	return time;
}

/**
 * _createSpinner - Create spinner component
 *
 * @param  {string} msg Message description
 * @return {DOM}  			Spinner
 */
Chat.createSpinner = function _createSpinner(msg){
	// <div class="wrap">
	// 	<div class="loading">
	// 		<div class="bounceball"></div>
	// 		<div class="text">Retriving History</div>
	// 	</div>
	// </div>
	var message = msg || 'Loading Content';

	var wrap = document.createElement('div');
	wrap.setAttribute('class', 'wrap');
	wrap.setAttribute('style', 'display:none;margin-top:15px;');

	var loading = document.createElement('div');
	loading.setAttribute('class', 'loading');

	var bounceball = document.createElement('div');
	bounceball.setAttribute('class', 'bounceball');

	var text = document.createElement('div');
	text.setAttribute('class', 'text');

	var _message = document.createTextNode(message);

	text.appendChild(_message);
	loading.appendChild(bounceball);
	loading.appendChild(text);
	wrap.appendChild(loading);

	return wrap
}


/**
 * _createChatZoneMessage - Create a message in the chat zone
 *
 * @param  {string}  message Message description
 * @param  {boolean} error   Error flag
 */
Chat.createChatZoneMessage = function _createChatZoneMessage(message, error){
// 	<div>
//     <i class="fa fa-comments fa-5x" aria-hidden="true"></i>
// 		 <h4>
//     	Select a conversation
//   	 </h4>
// </div>
	var _message = message || 'No messages'
	var container = document.createElement('div');
	container.setAttribute('class', 'chat-zone-msg-ctn');
	container.setAttribute('style', 'display:none;');

	var icon = document.createElement('i');
	if ( error ) {
		icon.setAttribute('class', 'fa fa-comments fa-5x');
	} else {
		icon.setAttribute('class', 'fa fa-comments fa-5x');
	}
	icon.setAttribute('aria-hidden', 'true');

	var title = document.createElement('h4');
	title.setAttribute('class', 'chat-title')

	var msg = document.createTextNode(_message);

	title.appendChild(msg);
	container.appendChild(icon);
	container.appendChild(title);

	//ADD TO CHAT ZONE
	var chat = document.getElementById('current-chat');
	chat.appendChild(container);

	//UGG JQUERY
	$( container ).fadeIn( "slow" );
}

/**
 * _focusLastMessageChat - Focus the last message on the chat component
 *
 * @return {type}  description
 */
Chat.focusLastMessageChat = function _focusLastMessageChat(msgContainer){
	var chatHistory = document.getElementById('chat-history');
	if ( chatHistory ){
		chatHistory.scrollTop = chatHistory.scrollHeight;
	}
}

document.addEventListener("DOMContentLoaded", function(){
	//INIT FIREBASE HELER
	firebaseHelper.init();
	//INIT CHAT
	Chat.init();
	// HANDLE USERS (LIST, ADDED AND UPDATED)
	firebaseHelper.updateUser(Chat.updateUser);
});
