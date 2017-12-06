//AUTHOR: 1004076
//NOTE: This could probably be done way more efficient, but at least it works
/*Browser Compatibility:
Versions lower than the ones specified here are probabably NOT compatible/do NOT work.
Versions of incompatible browsers released after 6-12-2017 may become compatible in the future once CSS Grid properties are implemented in those browsers
Desktop Browsers:
	Works on: 								Chrome (v57+), iOS Safari (v10.3+), Steam Web Browser (v017), Edge (v16+), Firefox (v52+), 
	Doesn't work on: 						IE, Opera Mini
	Presumably works on (but not tested): 	Opera (v47+),
Mobile Browsers:
	Works on: 								Android webview (v62+), Chrome for Android (v62+), Samsung Internet (v62+), Firefox for Android (v57+)
	Doesn't work on:						IE Mobile, Opera Mobile, Blackberry Browser
	Presumably works on (but not tested):	-
TODO: grid-template-columns for Edge. Test other browsers.
*/

$(document).ready(function() {  
	//What happens when "Login" (topright corner) is clicked
	$('#id_login_button').on('click', function(e) {
		e.preventDefault();
		//you can't login twice!
		if (!bIsLoggedIn) {
			$('#id_dropdown_login').stop().slideToggle();
		}else{
			$('#id_dropdown_logout').stop().slideToggle();
		}
	});

	//what happens when you submit the login-form
	$('#id_login_form').submit(function(e) {
		e.preventDefault();
		console.log('Login Form Submitted');
		const sUsername = $("#id_login_form input[name=username]").val();
		const sPassword = $("#id_login_form input[name=password]").val();

		//clear the fields
		$("#id_login_form input[name=username]").val("");
		$("#id_login_form input[name=password]").val("");

		//console.log("Someone tried to login. As this site is very safe we place the login-data here where nobody will look " + sUsername + '", ' + sPassword);
		iCurrentUser = getValidLogin(sUsername, sPassword);
		if (iCurrentUser >= 0){
			console.log("Valid login entered!");
			onLogin();
			$('#error_invalid_username_or_password').hide();
		}else{
			console.log("invalid username-password combination given");
			//show error msg
			$('#error_invalid_username_or_password').show();
		}
	});

	//what happens when you submit the logout-form
	$('#id_logout_form').submit(function(e) {
	  e.preventDefault();
	  console.log('Logout Form Submitted');
	  onLogout();
	}); 
  
	//What happens wehn the 'New Sticky' button is pressed
	$('#id_add_sticky_button').on('click', function(e) {
		console.log("Add Sticky button clicked");
		createStickynote(true, chooseRandomStickyColour()); //!!!
	});
  
	//update the grid each time the user zooms in or out
	$(window).resize(function() {
	  //console.log("Screen size changed!");
	   calculateGridSize();
	});

	//randomizes the colour of the 'Add sticky'-sticky
	$(".sticky_img").attr("src","./Images/stickynote_"+ chooseRandomStickyColour() + ".png"); 
    
  
	//what happens when the edit/create sticky popup is saved/cancelled:
	//(https://stackoverflow.com/questions/5721724/jquery-how-to-get-which-button-was-clicked-upon-form-submission)
	$(".sticky_edit").submit(function(e) { 
		e.preventDefault();
		if (bAddStickyPopupIsActive) {
			const val = $("input[type=submit][clicked=true]").val();
			if (val=="Save"){
				saveStickynote(sNewStickyColour,$("#id_sticky_form input[name=title]").val(), JSON.stringify(quill.getContents()));
			}else{
				cancelStickynote();
			}
			bAddStickyPopupIsActive = false;
			$('#id_popup_add_sticky').stop().fadeOut();
		}
	});
	$(".sticky_edit input[type=submit]").click(function() {
		$("input[type=submit]", $(this).parents(".sticky_edit")).removeAttr("clicked");
		$(this).attr("clicked", "true");
	});	
	
	//What happens when the 'Delete Sticky' option is clicked
	$('#id_sticky_options_delete_sticky').on('click', function(e) {
		console.log("Deleting sticky " + iSelectedSticky);
		deleteStickynote(iSelectedSticky-1);
		bAddStickyPopupIsActive = false;
		$('#id_popup_add_sticky').stop().fadeOut();
	});
	
	//animation when hovering over the 'delete sticky' button
	$('#id_sticky_options_delete_sticky').on('mouseenter', function(e) {
		$('#id_trashcan_icon').attr("src", "./Images/trashcan_white_open.png");
	}).on('mouseleave', function(e) {
		$('#id_trashcan_icon').attr("src", "./Images/trashcan_white_closed.png");
	});
	
	//update the grid upon load
	calculateGridSize();
	initColourList();
	
	/*
	$('.product-photo').on('mouseenter', function(event) {
		$(event.currentTarget).addClass('photo-active')
	}).on('mouseleave', function(event) {
		$(event.currentTarget).removeClass('photo-active')
	})*/
}); 

let bIsLoggedIn = false; //whether the user is logged in
let iNumMaxColStickies = 1; //updated in calculateGridSize();
let iPrevNavWidth = -1; //The scrollbarlistener fires the resize event twice, so this prevents unnecessary calculations

let tStickies = []; //array that will contain instances of the stickynote class
let sNewStickyColour; //set by the add-sticky button to keep track of a new sticky's colour
let bAddStickyPopupIsActive = false; //true when the add/edit-sticky popup is opened up
let iSelectedSticky = -1; //set by the onclicklisteners to retrieve the correct data

let iCurrentUser = -1; //the currently logged in user

//TODO: DOES NOT WORK FOR EDGE
function calculateGridSize() {
	//get screen size, etc. to adjust grid-template-columns dynamically. (Usually returned in pixels)	
	const iWidth = $('#id_navbar').width(); //NOT returned in pixels!
	
	//only update if there's a need to update.
	//(The scrollbar listener causes the event to fire twice if a scrollbar is active)
	if (iWidth != iPrevNavWidth){
		iPrevNavWidth = iWidth;
		let sColSize = $(".stickyNotesGrid").css("grid-template-columns");

		sColSize = sColSize.slice(0,sColSize.search("px"));
		const iColSize = parseInt(sColSize);
		//console.log("Width: " + iWidth + " | colSize: " + iColSize /*+ " | gridGap: " + sGridGap*/);
		
		//set the number of columns dynamically based on screen size:
		const iNumColumns = Math.floor(iWidth/iColSize);
		//const iNumColumns = Math.floor((iWidth - parseInt(sGridGap))/(parseInt(sColSize) + parseInt(sGridGap)));
		
		//calculate and set the grid_row_gap, grid_column_gap, and padding of the grid
		const iGapSize = (iWidth - iNumColumns*iColSize)/(iNumColumns + 1);
		$('.stickyNotesGrid').css("grid-column-gap",iGapSize + "px");
		$('.stickyNotesGrid').css("grid-row-gap",iGapSize + "px");
		$('.stickyNotesGrid').css("padding","0px " + iGapSize + "px");
		
		//console.log($('.stickyNotesGrid').css("grid-column-gap"));
		//console.log("ColGap: " + iGapSize + " | RowGap: " + iGapSize + " | Padding: " + iGapSize);
		
		//console.log("New Number of Columns (min 1): "+iNumColumns);
		$('.stickyNotesGrid').css("grid-template-columns","repeat( " + (iNumColumns > 0 ? iNumColumns : 1) + ","+ sColSize +"px)");
		iNumMaxColStickies = iNumColumns;
		console.log("Screen size updated");
	}
}

//stickynote class:
class Stickynote {
	constructor(sColour, sTitle, sContents) {
		this._colour = sColour;
		this._title = sTitle;
		this._contents = sContents;
	}
	get colour() {return this._colour;}
	get title() {return this._title;}
	get contents() {return this._contents;}
	
	set colour(sColour) {
		if (tStickyColours.indexOf(sColour)>=0) {
			//do nothing. setting the colour was valid
			this._colour = sColour;
		}else{
			console.log("ERROR: Sticky was given an invalid colour. Colour defaults to YELLOW");
			this._colour = "yellow";
		}
	};
	set title(sTitle) {
		//no checking needed as of now
		this._title = sTitle;
	}
	set contents(sContents) {
		//no checkign needed as of now
		this._contents = sContents;
	}
}

//available stickynote colours:
const tStickyColours = ['blue','brown','green','grey','orange','purple','red','turquoise','yellow'];
//file paths of these colours follow this format: root/Images/stickynote_COLOUR.png
const tStickyColoursRGBs = {
	//Colour	R		G		B
	blue: 		[109,	144,	206	],
	brown:		[133,	81,		46	],
	green:		[109,	206,	128	],
	grey:		[176,	176,	176	],
	orange:		[234,	142,	81	],
	purple:		[220,	136,	221	],
	red:		[206,	109,	109	],
	turquoise:	[109,	206,	206	],
	yellow:		[219,	220,	95	],
};

////////////////////////////////////////////////////////////////////////
//Everything related to the creation, deletion, styling, etc. of Sticky Notes

function chooseRandomStickyColour(){
	return tStickyColours[Math.floor(Math.random()*tStickyColours.length)];
}

//Creates a temporary stickynote on the screen
function createStickynote(bOpensEditor, sColour){
	//const sRandomStickyColour = chooseRandomStickyColour(); !!!
	sNewStickyColour = sColour;
	const stickyFormat = 	'<div class="sticky_data sticky_div new_sticky"><div class="stickynote clickable">' +
									'<img class="sticky_img sticky_elem" src="./Images/stickynote_' + sColour + '.png"/>' +
									'<p class="add_sticky_text sticky_elem">NEW STICKY</p>' +
								'</div></div>';
	let sticky = $(stickyFormat);   // Create with jQuery
	$(".stickyNotesGrid").append(sticky);      // Append the new element
	
	if (bOpensEditor) { //!!!
		iSelectedSticky = 0;
		openStickyEditor();
	}
}

//Creates (and saves) the actual stickynote
function saveStickynote(sRandomStickyColour, sTitle, sContents) {
	//do some extra stuff if a new sticky was created
	if (iSelectedSticky == 0){
		console.log("Sticky Added")
		
		sRandomStickyColour = sNewStickyColour;
		//create a sticky obj
		let pSticky = new Stickynote(sRandomStickyColour, sTitle, sContents);
		tStickies.push(pSticky);
		
		//if the user is logged in, also store the sticky in the UserData
		if (bIsLoggedIn){
			tUserData["user_" + tUsers[iCurrentUser].user_username].push(pSticky);
		}
		
		//remove the 'new_sticky' class from the newly rendered sticky;
		$( ".sticky_div:eq(-1)" ).removeClass("new_sticky");
		
		//Add an onclick-listener
		const temp = tStickies.length; //tStickies is a global variable, but we want the listener to always return the value this global had upon DECLARATION of the listener!
		$('.sticky_div:eq(-1)').on('click', function(e) {
			console.log('Existing Sticky Clicked: ' + temp);
			iSelectedSticky = temp;
			openStickyEditor();
		});
		
		iSelectedSticky = tStickies.length;
		
		//debug in the console:
		console.log("New sticky added: ");
	}else{
		console.log("Updating sticky " + iSelectedSticky);
	}
	
	//update the object
	tStickies[iSelectedSticky-1].colour = sRandomStickyColour;
	tStickies[iSelectedSticky-1].title = sTitle;
	tStickies[iSelectedSticky-1].contents = sContents;
	
	//Sort the stickies and update the screen (and log the result)
	sortStickies();
}

//what happens when the 'cancel' button is pressed in the sticky note editor
function cancelStickynote(){
	console.log("Changes discarded");
	$('.stickyNotesGrid div').remove('.new_sticky'); //remove newly created stickies (or save no data if a sticky was edited)
	//no need to update or sort here
}

//updates the display of stickynote at index i (based upon its data in the array)
//call this after updating the data of a sticky in the array
function updateStickynote(i){
	//update the title
	$( ".sticky_div p:eq(" + (i+1) + ")" ).text(tStickies[i].title);
	//update the colour
	$(".sticky_div .sticky_img:eq(" + (i+1) + ")").attr("src","./Images/stickynote_"+ tStickies[i].colour + ".png");
	//DO NOT CALL sortStickies() IN HERE AS sortStickies() CALLS THIS FUNCTION!
}

//deletes the stickynote at index i;
function deleteStickynote(i){
	console.log("Sticky " + tStickies[i].title + "(" + i + ") has been deleted...")
	tStickies[i] = tStickies[tStickies.length-1]; //put the last element in its place (so we don't fck up the onclicklisteners)
	tStickies.pop(); //delete the data from the array
	$('.stickyNotesGrid div').remove(".sticky_div:eq(-1)") //delete the sticky from the screen
	
	if (bIsLoggedIn){
		//same as above but for "tUserData["user_" + tUsers[iCurrentUser].user_username]" instead of "tStickies"
		tUserData["user_" + tUsers[iCurrentUser].user_username][i] = tUserData["user_" + tUsers[iCurrentUser].user_username][tUserData["user_" + tUsers[iCurrentUser].user_username].length-1]; //put the last element in its place
		tUserData["user_" + tUsers[iCurrentUser].user_username].pop(); //delete the data from the array
	}
	
	//sort and update the stickies (and log the result)
	sortStickies();
}

//gets rid of all stickies on the screen. I.e. it DELETES them
function clearStickies(){
	//delete backwards
	for (i=tStickies.length-1; i>=0; i--){
		deleteStickynote(i);
	}
}

//call this when the stickies need to be sorted
//this function doesn't actually re-arrange the divs on the screen, it simply changes al lthe data within them
function sortStickies() {
	tStickies.sort(sortStickyByTitle); //sort the array
	if (bIsLoggedIn){
		console.log('hi there');
		//also update the userData-table if the user is logged in (we want the same order for simplicity)
		(tUserData["user_" + tUsers[iCurrentUser].user_username]).sort(sortStickyByTitle);
		console.log(JSON.parse(JSON.stringify(tUserData["user_" + tUsers[iCurrentUser].user_username])));
	}
	
	for (i = 0; i<tStickies.length; i++) {
		updateStickynote(i);
	}
	console.log("SORTED: ");
	console.log(JSON.parse(JSON.stringify(tStickies)));
}

//sort function for sorting the sticky array
function sortStickyByTitle(a, b) {
  if (a.title.toUpperCase() < b.title.toUpperCase()) {
    return -1;
  }
  if (a.title.toUpperCase() > b.title.toUpperCase()) {
    return 1;
  }
  //leave the order as is if two stickies have the same title. I.e. the sticky that was created FIRST appears FIRST
  return 0;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
//stickynote editor:

function openStickyEditor(){
	console.log('STICKY EDITOR OPENED UP... (' + iSelectedSticky + ')');
	if (iSelectedSticky == 0){
		//Newly created sticky (I.e. No data)
		$("#id_popup_add_sticky input[name=title]").val("");
		quill.setContents("");
		$(".popup_title").text("Create Sticky");
	}else{
		//existing sticky that the user wants to edit
		console.log(tStickies[iSelectedSticky-1]);
		let pSelectedSticky = tStickies[iSelectedSticky-1];
		$("#id_popup_add_sticky input[name=title]").val(pSelectedSticky.title);
		quill.setContents(JSON.parse(pSelectedSticky.contents));
		$(".popup_title").text("Edit Sticky");
		sNewStickyColour = pSelectedSticky.colour;
	}
	updateEditorOptions();
	//Set the editor's colour to the sticky's colour
	updateEditorColours(sNewStickyColour);
	
	bAddStickyPopupIsActive = true;
	$('#id_popup_add_sticky').stop().fadeIn();
}

//Editor color defintions. Several pieces get a darker or lighter shade based upon the Sticky Colour. Several variables for possible finetuning
const iHeaderColourModifier = 0.75; //the Sticky's Header receives a darker shade of said colour
const iButtonColourModifier = 0.75; //the save/cancel buttons receive a darker shade of said colour
const iEditorColourModifier = 0.75; //the Quill editor receives a lighter shade of said colour
const iOptionElementColourModifier = 0.75; //the background-colour for the options is a bit lighter
const iOptionElementBorderColourModifier = 0.75; //the border-colour for the options is a bit darker
const iOptionElementTextColourModifier = 0.75; //the text-colour gets the dark variant;

//Updates the Editor's Colours:
function updateEditorColours(sColour){
	console.log("Updating editor colours: " + sColour);
	
	//set the correct checkbox:
	$('#id_sticky_options_form_colour input[name=colour][value=' + sColour + ']').prop('checked', true);
	
	if (iSelectedSticky == 0) {
		//update the NEW STICKY as well
		$( ".new_sticky:eq(-1) .sticky_img" ).attr("src","./Images/stickynote_" + sColour + ".png");
	}
	
	const iR = tStickyColoursRGBs[sColour][0];
	const iB = tStickyColoursRGBs[sColour][1];
	const iG = tStickyColoursRGBs[sColour][2];
	
	$('.popup .sticky_edit .header').css("background-color","rgb(" + Math.round(iR*iHeaderColourModifier) + ", " + Math.round(iB*iHeaderColourModifier) + ", " + Math.round(iG*iHeaderColourModifier) + ")");
	$('.popup .sticky_edit .body').css("background-color","rgb(" + iR + ", " + iB + ", " + iG + ")");
	$('.popup .sticky_edit .body .buttons input').css("background-color","rgb(" + Math.round(iR*iButtonColourModifier) + ", " + Math.round(iB*iButtonColourModifier) + ", " + Math.round(iG*iButtonColourModifier) + ")");
	$('.popup .sticky_edit .body form .editor_input').css("background-color","rgb(" + Math.round(iR + (255-iR)*iEditorColourModifier) + ", " + Math.round(iB + (255-iB)*iEditorColourModifier) + ", " + Math.round(iG + (255-iG)*iEditorColourModifier) + ")");
	$('.popup .sticky_edit .body #id_sticky_options .sticky_option_element').css("background-color","rgb(" + Math.round(iR + (255-iR)*iOptionElementColourModifier) + ", " + Math.round(iB + (255-iB)*iOptionElementColourModifier) + ", " + Math.round(iG + (255-iG)*iOptionElementColourModifier) + ")");
	$('.popup .sticky_edit .body #id_sticky_options .sticky_option_element').css("border-color","rgb(" + Math.round(iR*iOptionElementBorderColourModifier) + ", " + Math.round(iB*iOptionElementBorderColourModifier) + ", " + Math.round(iG*iOptionElementBorderColourModifier) + ")");
	$('.popup .sticky_edit .body #id_sticky_options h3').css("color","rgb(" + Math.round(iR*iOptionElementTextColourModifier) + ", " + Math.round(iB*iOptionElementTextColourModifier) + ", " + Math.round(iG*iOptionElementTextColourModifier) + ")");
	//$('.popup .sticky_edit .body #id_sticky_options label').css("color","rgb(" + Math.round(iR*iOptionElementTextColourModifier) + ", " + Math.round(iB*iOptionElementTextColourModifier) + ", " + Math.round(iG*iOptionElementTextColourModifier) + ")");
	
}

//Reads all available colours from the array and appends them to the option in the menu
//This only needs to be done ONCE (as no new colours get added after page-load)
function initColourList(){
	for (i=0; i<tStickyColours.length; i++) {
		const optionFormat = 	'<div><label class="clickable"><input type="radio" name="colour" value="' + tStickyColours[i] + '"/><strong>' + tStickyColours[i].toUpperCase() + '</strong></label></div>';
		$("#id_sticky_options_form_colour").append($(optionFormat)); // Create & Append the new element
		
		//set the text-colour to its respective stickynote colour
		const iR = tStickyColoursRGBs[tStickyColours[i]][0];
		const iB = tStickyColoursRGBs[tStickyColours[i]][1];
		const iG = tStickyColoursRGBs[tStickyColours[i]][2];
		$("#id_sticky_options_form_colour label:eq(" + i + ")").css("color","rgb(" + iR + ", " + iB + ", " + iG + ")");
		
		const temp = i;
		$("#id_sticky_options_form_colour label:eq(" + i + ")").on('click', function(e) {
			console.log('Sticky Colour Changed: ' + temp);
			sNewStickyColour = tStickyColours[temp];
			updateEditorColours(tStickyColours[temp]);
		});
	}	
}

function updateEditorOptions(){
	if (iSelectedSticky == 0){
		console.log("MIHIHIHIHIHI");
		$('.edit_only').hide();
	}else{
		console.log("MUAHAHAHAHAHA");
		$('.edit_only').show();
	}
}

/////////////////////////////////////////////////////////////////////////////////////
//Everything related to user handling

//contains all Users
const tUsers = [
	{
		user_username: "2id60", //should be unique & can only contain numbers/letters
		user_password: "password", //password is a reserved keyword D:
		user_name: "[2ID60]",
		//more data could be stored here. E.g. profile picture (probably something to expand on for Assignment 2)
	},
	{
		user_username: "DeusVult",
		user_password: "We must free the holy land",
		user_name: "Crusader",
	},
];

//stores all stickies created by a specific user
//contains some hardcoded default data to show interactions
const tUserData = {
	//usernames are prefixed by 'user_' so that usernames can start with numbers
	user_2id60: 	[ 
						new Stickynote("blue", "Assignments", JSON.stringify({"ops":[{"insert":"Create a responsive website"},{"attributes":{"list":"ordered"},"insert":"\n"},{"insert":"Extend the responsive website with databases"},{"attributes":{"list":"ordered"},"insert":"\n"},{"insert":"GRAND FINALE GROUP ASSIGNMENT"},{"attributes":{"list":"ordered"},"insert":"\n"}]})),
						new Stickynote("green", "Shoppinglist", JSON.stringify({"ops":[{"insert":"2 Eggs\n3 Gallons of Milk\n1 Watermelon\n4 Bags of Doritos\n12 Litres of Soda\n"}]})),
					],
	user_DeusVult: 	[
						new Stickynote("yellow", "Future Plans", JSON.stringify({"ops":[{"insert":"Conquer Jerusalem"},{"attributes":{"list":"bullet"},"insert":"\n"},{"insert":"Slay Infidels"},{"attributes":{"list":"bullet"},"insert":"\n"},{"insert":"Praise the Sun"},{"attributes":{"list":"bullet"},"insert":"\n"},{"insert":"Free the Holy Land"},{"attributes":{"list":"bullet"},"insert":"\n"},{"insert":"\n"},{"attributes":{"underline":true,"italic":true,"bold":true,"link":"https://memegenerator.net/img/images/600x600/15213750/deus-vult.jpg"},"insert":"DEUS VULT!"},{"insert":"\n"}]})),
					],
}


//returns the user's index if the given username-password combination are valid, returns -1 otherwise
function getValidLogin(sUsername, sPassword){
	for (i=0; i<tUsers.length; i++){
		//console.log(tUsers[i].user_username + ", " + tUsers[i].user_password);
		if (tUsers[i].user_username === sUsername && tUsers[i].user_password === sPassword){
			console.log('VALID');
			return i;
		}
	}
	return -1;
}

//retrieves and places the user's stickies on the screen
function retrieveUserStickies(sUsername){
	const sUser = "user_" + sUsername;
	for (i=0; i<tUserData[sUser].length; i++){
		let pSticky = tUserData[sUser][i];
		//prevent duplicate data
		if (!isStickyLoadedInTable(tStickies, pSticky)){
			createStickynote(false, pSticky.colour);
			
			//this actually places a POINTER to the UserData-table-entry in the array.
			tStickies.push(pSticky);
			
			//remove the 'new_sticky' class from the newly rendered sticky;
			$( ".sticky_div:eq(-1)" ).removeClass("new_sticky");
			
			//Add an onclick-listener
			const temp = tStickies.length; //tStickies is a global variable, but we want the listener to always return the value this global had upon DECLARATION of the listener!
			$('.sticky_div:eq(-1)').on('click', function(e) {
				console.log('Existing Sticky Clicked: ' + temp);
				iSelectedSticky = temp;
				openStickyEditor();
			});
			
			iSelectedSticky = tStickies.length;
		}
		//TODO: setting the onclicklistener, etc. appears in two functions now -> Merge to ONE
	}
}

//checks if a given sticky is already loaded into a given table (to prevent duplicates)
function isStickyLoadedInTable(tTable, pSticky){
	for (j=0; j<tTable.length; j++){ //can't use i as an iterator here because other functions call this function in an iterator with i #justjavascriptthings
		if (tTable[j] === pSticky){
			console.log('already loaded: ' + pSticky.title);
			//return true if another sticky refers to the same object
			return true;
		}
	}
	console.log('NOT yet loaded: ' + pSticky.title);
	return false;
}

//when logging in, save all the user's stickies to the tUserData
//the objects will be stored there, and the elements in tStickies will be updated to contain pointers to that data
function onLogin(){
	$('#id_dropdown_login').stop().slideUp();
	bIsLoggedIn = true;
	//Update the text to state 'Logged in'
	$('#id_login_button').text('LOGGED IN (' + tUsers[iCurrentUser].user_name + ')');
	//Greeting to the user
	$('#id_greeting_user').text('Hi ' + tUsers[iCurrentUser].user_name + '!');
	
	//Retrieve the user's stickies from the userData-table
	retrieveUserStickies(tUsers[iCurrentUser].user_username);
	
	//add the stickies that were created before the user logged in to his userData
	const tCurrentUserData = tUserData["user_" + tUsers[iCurrentUser].user_username];
	for (i=0; i<tStickies.length; i++){
		if (!isStickyLoadedInTable(tCurrentUserData,tStickies[i])){
			console.log("Not loaded, so adding it to tUserData!");
			tCurrentUserData.push(tStickies[i]);
			//because class instances/objects work via pointers in js, we don't need special handling to ensure that data changed in
			//tStickeis is also changed in tUserData!
		}
	}
	
	//Sort the stickies and update the screen (and log the result)
	sortStickies();
}

//what happens when the user logs out
function onLogout(){
	$('#id_dropdown_logout').stop().slideUp();
	bIsLoggedIn = false;
	$('#id_login_button').text('LOGIN');
	clearStickies();
}

////////////////////////////////////////////////////////////////////////////////////
//Initialize Quill editor (used in the sticky editor)
var quill = new Quill('.quill_editor', {
	modules: {
		history: {
			delay: 2000,
			maxStack: 500,
			userOnly: true
		},
	},
	bounds: '#scrolling-container',
	scrollingContainer: '#scrolling-container', 
	placeholder: "Insert Contents Here...",
	theme: 'snow',
});


