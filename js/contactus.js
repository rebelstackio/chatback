/**
 * ContactUs Form class
 * @author jegj
 */
var ContactUsForm = {	};

ContactUsForm.CONTACTFORM_POSITION = 3750;

ContactUsForm.FOCUSED = false;

ContactUsForm.LAST_MESSAGE_FROM_CLIENT = true;

ContactUsForm.TRUNCATED_LENGTH = 50;

ContactUsForm.LAST_CLIENT_MESSAGE = null;

ContactUsForm.SEND_MESSAGE_KEY = 13;

/**
 * _init - Init methods
 *
 */
ContactUsForm.init = function _init(){

	firebaseHelper.init().then(function() {
		console.log('client registered in the server');
		window.addEventListener('scroll', function(){
			if ( ContactUsForm.checkFormFocus() && !ContactUsForm.FOCUSED ) {
				ContactUsForm.FOCUSED = true;
				ContactUsForm.getHistory().then(function(data){
					if ( data ){
						ContactUsForm.buildPreviousConversation(data.val());
					} else {
						//TODO REMOVE SETTIMEOUT - JUST FOR TESTING
						setTimeout(function(){
							ContactUsForm.buildContactForm();
						}, 2000);
					}
				}).catch(function(error){
					//TODO HANDLE ERROR WHEN THERE IS NOR CONNECTION TO FIREBASE
				})
			}
		});
	}).catch(function(error){
		console.log('Error trying to connect to server', error);
		//TODO HANDLE ERROR WHEN THERE IS NOR CONNECTION TO FIREBASE THE FIRST TIME
	});
}


/**
 * _buildPreviousConversation - Build previous conversation
 *
 * @param  {Object} messages List of previous messages
 */
ContactUsForm.buildPreviousConversation = function _buildPreviousConversation(messages){
	//BUILD CHAT COMPONENt
	ContactUsForm.buildChatComponent();

	var keys = Object.keys(messages);
	var keyLength = keys.length;

	for (var i = 0; i < keyLength; i++) {
		var message = messages[keys[i]];
		switch (message['source']) {
			case 'CLIENT':
				ContactUsForm.buildClientMessage(
					message['message'],
					message['createdAt'],
					message['read']
				);
				break;
			case 'SERVER':
				ContactUsForm.buildServerMessage(
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
 * _buildContactForm - Build the initial contact form
 *
 * @return {DOM}	Contact Form
 */
ContactUsForm.buildContactForm = function _buildContactForm(){
	var form = document.createElement('form');
	form.setAttribute('id', 'contact-form');
	form.setAttribute('class', 'contact-form');
	form.setAttribute('role',	'form');
	form.setAttribute('style','display:none;');
	//NAME INPUT
	var input = document.createElement('input');
	input.setAttribute('type', 'text');
	input.setAttribute('class', 'form-control');
	input.setAttribute('id', 'name');
	input.setAttribute('name', 'name');
	input.setAttribute('placeholder', 'Name');
	input.setAttribute('required', 'required');
	//EMAIL
	var email = document.createElement('input');
	email.setAttribute('type', 'email');
	email.setAttribute('class', 'form-control');
	email.setAttribute('id', 'email');
	email.setAttribute('name', 'email');
	email.setAttribute('placeholder', 'Email');
	email.setAttribute('required', 'required');
	//MESSAGE
	var message = document.createElement('textarea');
	message.setAttribute('class', 'form-control');
	message.setAttribute('id', 'message');
	message.setAttribute('name', 'message');
	message.setAttribute('placeholder', 'Message');
	message.setAttribute('rows', '10');
	message.setAttribute('required', 'required');
	// BUTTON
	var button = document.createElement('button');
	button.setAttribute('class', 'btn btn-main btn-lg');
	button.setAttribute('type', 'submit');
	button.setAttribute('id', 'send');
	button.setAttribute('data-loading-text', "<i class='fa fa-spinner fa-spin'></i> Sending...");

	button.addEventListener( 'click', ContactUsForm.saveContatForm);

	var ie = document.createElement('i');
	ie.setAttribute('class', 'fa fa-paper-plane ');
	var text = document.createTextNode('Send');
	button.appendChild(ie);
	button.appendChild(text);
	//ALERT MESSAGE
	var alert = document.createElement('div');
	alert.setAttribute('id', 'result-message');
	alert.setAttribute('role', 'alert');

	form.appendChild(input);
	form.appendChild(email);
	form.appendChild(message);
	form.appendChild(button);

	var formContainer = document.getElementById('form-container');
	formContainer.innerHTML = "";
	formContainer.appendChild(form);
	formContainer.appendChild(alert);

	//UGG JQUERY
	$( "#contact-form" ).fadeIn( "slow" );

	// <form class="contact-form" role="form" action="https://secure.mailjol.net/allforms/u/a5b1c394.php">
	// 	<input type="text" class="form-control" id="Name" name="Name" placeholder="Name" required>
	// 	<input type="email" class="form-control" id="Email" name="Email" placeholder="Email" required>
	// 	<textarea id="Message" name="Message" placeholder="Message" class="form-control" rows="10"></textarea>
	// 	<button class="btn btn-main btn-lg" type="submit" id="send" data-loading-text="<i class='fa fa-spinner fa-spin'></i> Sending..."><i class="fa fa-paper-plane "></i> Send</button>
	// </form>
	// <div id="result-message" role="alert"></div>
}


/**
 * _buildContactForm - Valid cantact form
 *
 */
ContactUsForm.saveContatForm = function _saveContatForm( e ){
	var form = document.getElementById('contact-form');
	if ( form.checkValidity()){
		e.preventDefault();
		var name = document.getElementById('name').value;
		var email = document.getElementById('email').value;
		var message = document.getElementById('message').value;
		var user = {
			'name': name,
			'email': email
		};

		//SAVE USER INFORMATION
		ContactUsForm.saveUserInformation(user);

		//BUILD CHAT COMPONENT
		ContactUsForm.buildChatComponent(message);

		// ASK FOR PERMISSION TO WEB NOTIFICATION
		if ( window.Notification ){
			window.Notification.requestPermission();
		}
	}
}


/**
 * _focusLastMessageChat - Focus the last message on the chat component
 *
 * @return {type}  description
 */
ContactUsForm.focusLastMessageChat = function _focusLastMessageChat(msgContainer){
	var chatHistory = document.getElementById('chat-history');
	if ( chatHistory ){
		chatHistory.scrollTop = chatHistory.scrollHeight;
	}
}

 /**
  * _buildChatComponent - Build chat component
  *
  * @param  {type} message Message description
  */
ContactUsForm.buildChatComponent = function _buildChatComponent(message){
	// <div class="chat">
	// <div class="chat-history">
	// <ul class="chat-ul">

	var form = document.getElementById('form-container');

	var chatDiv = document.createElement('div');
	chatDiv.setAttribute('class', 'chat');
	chatDiv.setAttribute('id', 'chat-container');
	chatDiv.setAttribute('style', 'display:none;');

	var chatHistoryDiv = document.createElement('div');
	chatHistoryDiv.setAttribute('class', 'chat-history');
	chatHistoryDiv.setAttribute('id', 'chat-history');

	var messageZone = ContactUsForm.buildMessageZone();

	var chatUl = document.createElement('ul');
	chatUl.setAttribute('class', 'chat-ul');
	chatUl.setAttribute('id', 'chat-list');

	chatHistoryDiv.appendChild(chatUl);
	chatDiv.appendChild(chatHistoryDiv);
	chatDiv.appendChild(messageZone);

	form.innerHTML = "";

	form.appendChild(chatDiv);

	//FOCUS
	messageZone.focus();

	//SEND CLIENT MESSAGE
	if ( message ){
		ContactUsForm.sendClientMessage(message);
	}

	//UGG JQUERY
	$( "#chat-container" ).fadeIn( "slow" );

}


/**
 * _buildServerMessage - Build DOM elements from server's message
 *
 * @param  {string} 		message   Message descrition
 * @param  {timestamp} 	createdAt Message createdAt date
 * @param  {boolean} 		read      Meesage read by the rebel team
 */
ContactUsForm.buildServerMessage = function _buildServerMessage(message, createdAt, read){
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
	var messageDataText = document.createTextNode(' RebelStack Team - ');
	strongText.appendChild(messageDataText);

	var time = ContactUsForm.buildDateMessageFormat();

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
	ContactUsForm.focusLastMessageChat();

	//NOTIFICATION
	ContactUsForm.sendBrowserNotification(message);
}

 /**
  * _sendClientMessage - Send the client message to firebase server
  *
  * @param  {type} message Message description
  * @param  {type} user    User object (OPTIONAL)
  * @return {type}         Firebase Promise
  */
ContactUsForm.sendClientMessage = function _sendClientMessage(message){
	var lastMessage = ContactUsForm.buildClientMessage(message, null, null, true);
	//TODO REMOVE SETTIMEOUT - JUST FOR TESTING
	setTimeout(function(){
		firebaseHelper.sendClientMessage(message).then(function(){
			console.log('Message  has been sent to the server ');
			//CHANGE MESSAGE ICON TO SENT
			var icon = lastMessage.getElementsByClassName('fa-paper-plane')[0];
			icon.setAttribute('class', 'fa fa-circle you');
			icon.setAttribute('title', 'Message sent');
		}).catch(function(error){
			console.log('There is an error sending the meesage', error);
			//CHANGE MESSAGE ICON TO ERROR AND CHANGE CONTAINER'S  BG COLOR
			var messageContainer = lastMessage.getElementsByClassName('you-message')[0];
			messageContainer.setAttribute('class', 'message you-message-error');
			var iconContainer = lastMessage.getElementsByClassName('message-data-name')[0];
			var icon = iconContainer.getElementsByClassName('fa-paper-plane')[0];
			icon.setAttribute('class', 'fa fa-times you-error');
			icon.setAttribute('aria-hidden', 'true');
			icon.setAttribute('title', 'The message hasn\'t been sent');
		})
	}, 2000);
}


 /**
  * _buildClientMessage - Build DOM elements from client's message
  *
  * @param  {string} 		message   Message descrition
  * @param  {timestamp} createdAt Message createdAt date
  * @param  {boolean} 	read      Meesage read by the rebel team
  * @param  {boolean} 	sending   Meesage is sending to the server
  */
ContactUsForm.buildClientMessage = function _buildClientMessage(message, createdAt, read, sending){
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

	var time = ContactUsForm.buildDateMessageFormat(createdAt);

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
	ContactUsForm.LAST_CLIENT_MESSAGE = messageContainer;

	//FOCUS LAST MESSAGE
	ContactUsForm.focusLastMessageChat();

	return messageContainer;
}

 /**
  * _sendBrowserNotification - Send browser notification to the user
  *
  * @param  {type} message Custom message
  */
ContactUsForm.sendBrowserNotification = function _sendBrowserNotification(message){
	if ( !ContactUsForm.checkFormFocus() ) {
		if ( window.Notification ) {
			if ( window.Notification.permission == "granted" ) {
				if ( message.length > ContactUsForm.TRUNCATED_LENGTH ){
					message = message.substr(0,ContactUsForm.TRUNCATED_LENGTH) + '...';
				}

				var notification = new Notification(
					'New Message from RebelStack\'s Team',
					{
						icon: '../images/logo-notification.png',
						body: message,
						vibrate: [200, 100, 200],
						sound: '../sounds/new_message.mp3'
					}
				);

				notification.onclick = function () {
					location.href = "#message-zone";
				};
			}
		} else {
			console.log("Notifications are not supported for this Browser/OS version yet.");
		}
	}
}


/**
 * _buildMessageZone - Build the textarea above the chat
 *
 * @return {DOM}  MessageZone Component
 */
ContactUsForm.buildMessageZone = function _buildMessageZone(){
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
 * _saveUserInformation - Save the user information in memry(also it could be in localstorage)
 *
 */
ContactUsForm.saveUserInformation = function _saveUserInformation(user) {
	if ( user ){
		ContactUsForm.USER = user;
		//SAVE CLIENT INFO ON DATABASE
		firebaseHelper.saveClientInfo(user).then(function(){
			console.log('User updated with info');
		}).catch(function(error){
			console.error('Error trying to save User\'s info', error);
		})
	}
}

 /**
  * _buildDateMessageFormat - Build the date componenet next to the message label
  *
  * @param  {type} createdAt Message Created Date
  * @return {DOM} 					 Date component
  */
ContactUsForm.buildDateMessageFormat = function _buildDateMessageFormat(createdAt){
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
 * _getHistory - Get the previous conversations with the client base on client's token
 * @return {Promise} Firebase Promise
 *
 */
ContactUsForm.getHistory = function _getHistory( ) {
	console.log('getting the last messages');
	return firebaseHelper.getMessages( );
}

/**
 * _checkFormFocus - Check when the contact section is focused
 *
 * @return {boolean}
 */
ContactUsForm.checkFormFocus = function _checkFormFocus() {
	var body = document.getElementsByTagName('body')[0];
	return body.scrollTop >= ContactUsForm.CONTACTFORM_POSITION;
}

document.addEventListener("DOMContentLoaded", function(){
	ContactUsForm.init();
});
