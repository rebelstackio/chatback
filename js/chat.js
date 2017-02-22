/**
 * Chat	class
 * @author jegj
 */
var Chat = {	};


Chat.FOCUS_NAME = null;

Chat.FOCUS_EMAIL = null;


/**
 * _init - Init Chat component
 */
Chat.init = function _init(){
	Chat.buildContactList();
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

	var col = document.createElement('div');
	col.setAttribute('class', 'col-md-12');
	col.setAttribute('id', 'users-col');
	row.appendChild(col);
	chatContainer.appendChild(row);
}


/**
 * _createUserComponent - Create client list component
 *
 * @param  {Object} userObj User object
 * @param  {string} userId  User ID
 */
Chat.createUserComponent = function _createUserComponent (userObj,  userId) {
	var col = document.getElementById('users-col');
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
		userLink.setAttribute('id', 'link' + userId);
		userLink.setAttribute('data-id',	userId);
		userLink.setAttribute('data-name',	userObj.name);
		userLink.setAttribute('data-email',	userObj.email);
		userLink.setAttribute('data-lastActivity',	userObj.lastActivity);
		userLink.addEventListener( 'click', Chat.userClickEvent);
		var text = document.createTextNode(userObj.email);
		userLink.appendChild(text);
		col.appendChild(userLink);
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
	Chat.FOCUS_NAME = domElement.getAttribute('data-name');
	Chat.FOCUS_EMAIL = domElement.getAttribute('data-email');
	firebaseHelper.getMessageByUserId(id).then(function(data){
		if ( data.val()){
			Chat.createMessageZoneByUserMessages();
			Chat.buildPreviousConversation(data.val());
		} else {
			//TODO NO MESSAGES
		}
	}).catch(function(error){
		//TODO HANDLE ERROR WHEN THERE IS AN ERROR GETTING USER'S MESSAGES
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
		if (key === ContactUsForm.SEND_MESSAGE_KEY){
			event.preventDefault();
			var message = event.target.value;
			event.target.value = "";
			ContactUsForm.sendClientMessage(message);
		}
	});
	return message;
}

 /**
  * _addNewUser - Add the new user to the list
  *
  * @param  {object} user User Object
  */
Chat.addNewUser = function _addNewUser(user){
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
				Chat.buildServerMessage(
					message['message'],
					message['createdAt'],
					message['read']
				);
				break;

			case 'SERVER':
				Chat.buildClientMessage(
					message['message'],
					message['createdAt'],
					message['read']
				);
				break;
			default:
				console.log('Invalid message\'s source ', message);
				break;
		}
	}
}

/**
  * _buildClientMessage - Build DOM elements from client's message
  *
  * @param  {string} 		message   Message descrition
  * @param  {timestamp} createdAt Message createdAt date
  * @param  {boolean} 	read      Meesage read by the rebel team
  * @param  {boolean} 	sending   Meesage is sending to the server
  */
Chat.buildClientMessage = function _buildClientMessage(message, createdAt, read, sending){
	// <li>
	// 	<div class="message-data">
	// 		<span class="message-data-name"><i class="fa fa-circle you"></i> You</span>
	// 	</div>
	// 	<div class="message you-message">
	// 		A new client?!?! I would love to help them, but where are we going to find the time?
	// 	</div>
	// </li>
	var messageContainer = document.createElement('li');
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
Chat.buildServerMessage = function _buildServerMessage(message, createdAt, read){
	var message = 'default chat message';
	// <li class="clearfix">
	// 	<div class="message-data align-right">
	// 		<span class="message-data-name">RebelStack </span> <i class="fa fa-circle me"></i>
	// 	</div>
	// 	<div class="message me-message float-right"> We should take a look at your onboarding and service delivery workflows, for most businesess there are many ways to save time and not compromise quality.	</div>
	// </li>

	var messageContainer = document.createElement('li');
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

	var time = Chat.buildDateMessageFormat();

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
	chatList.appendChild(messageContainer);

	//UGG JQUERY
	$(messageContainer).fadeIn( "slow" );

	//FOCUS LAST MESSAGE
	Chat.focusLastMessageChat();

	//NOTIFICATION
	//ContactUsForm.sendBrowserNotification(message);
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
	firebaseHelper.init();
	Chat.init();
	firebaseHelper.newUserClick(Chat.addNewUser);
});
