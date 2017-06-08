/*
 * Copyright (c) 2006 Ichro Maruta
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 * */

var lookup_statement;
var mDBConn;

function cleanup_key(key)
{
	key=key.replace(/\n/gm,' ').replace(/\r/gm,' ');
//	key=key.replace(/[^a-zA-Z\-\s]/g,'');
	return key;
}

function lookup_db(key)
{
	var dat;
	key=cleanup_key(key);

	try{
		lookup_statement.bindUTF8StringParameter(0, key);
		while (lookup_statement.executeStep()) {
		  dat = lookup_statement.getString(1);
		}
	}catch(err){
		alert(key);
	}finally{
		lookup_statement.reset();
	}
	return dat;
}

function open_db()
{
	var file = Components.classes["@mozilla.org/file/directory_service;1"]
                     .getService(Components.interfaces.nsIProperties)
                     .get("ProfD", Components.interfaces.nsIFile);
	file.append("mouseoverdictionary.sqlite");
	var storageService = Components.classes["@mozilla.org/storage/service;1"]
                        .getService(Components.interfaces.mozIStorageService);
    
    mDBConn= storageService.openDatabase(file);
	mDBConn.executeSimpleSQL("CREATE TABLE IF NOT EXISTS dict (key TEXT PRIMARY KEY,desc TEXT)");
}

function initialize()
{
	open_db();
	lookup_statement = mDBConn.createStatement("SELECT * FROM dict WHERE key = ?1");

	var content = document.getElementById("content");
	content.addEventListener("mousemove", handlemousemove, false);
}

function format(key,dat)
{
	var ret='<div class="key">'+key+'</div><div class="desc">';
//	dat=dat.replace(/\\ (・.+?)(\\ |$)/gm,'<span class="ex">\\ $1\\ </span>');
	dat=dat.replace(/・[a-zA-Z].+?(\\ |$)/gm,'');
	dat=dat.replace(/◆(.+?)\\ /gm,'<span class="annote">◆$1\\ </span>');
	dat=dat.replace(/【＠】.*$/gm,'');
	dat=dat.replace(/\\ /g,'<br>');
	return ret+dat+'</div>';
}

var laststr;
function handlemousemove(evt)
{
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                getService(Components.interfaces.nsIPrefBranch);
	var sidebar=top.document.getElementById("sidebar");
	var result = sidebar.contentDocument.getElementById("result");

	if(result == null) return;
	
	var doc=result.contentDocument;
	var parent = evt.rangeParent;
	var range;
	var str = "",str2="";
 	
 	if(parent == null || parent.nodeType != Node.TEXT_NODE){
 		return ;
 	}

	range = parent.ownerDocument.createRange();
    range.setStart(evt.rangeParent, evt.rangeOffset);
    range.setEnd(evt.rangeParent, evt.rangeOffset);
    
    expandRangeToWord(range);
	str = range.toString();

    if(laststr==str){
    	 return;
    }else{
    	laststr=str;
    }

	mDBConn.executeSimpleSQL("BEGIN TRANSACTION");
    
    var match_count=0;
    
	doc.open();
	doc.write('<style type=text/css>div.key{color:#000088;font-weight:bold;font-size:100%}div.error{color:red;font-weight:bold;}div.desc{font-size:90%;}span.annote{color:green;}span.ex{color:orange;}</style>');
	var fontsize=prefs.getIntPref("extensions.mouseoverdictionary.sidebar_font_size");
	if(fontsize<0){
		fontsize=fontsize+"";
	}else{
		fontsize="+"+fontsize;
	}
	doc.write('<font size='+fontsize+'>');

	var docdat="";
	var key=str;
	
	
	function try_word(word)
	{		
		var desc;
		if((desc=lookup_db(word))!=undefined){
			match_count++;
			docdat=((docdat=="") ? "":docdat+"<hr>")+format(word,desc);
			return true;
		}
		return false;
	}

	function try_phrase(word)
	{
		if( word.match(/[^A-Za-z0-9\s]/) ){
			return false;
		}

		var desc;
		if((desc=lookup_db(word))!=undefined){
			match_count++;
			docdat=format(word,desc)+((docdat=="") ? "":"<hr>")+docdat;
			return true;
		}
		return false;
	}

	if(!str.match(/[^A-Za-z0-9\s]/) ){
		if(str!=str.toLowerCase()){
			try_word(str)
			str=str.toLowerCase();
		}

		try_word(str);
		
		if(str.match(/ied$/)){
			try_word(str.replace(/ied$/,'y'));
		}

		if(str.match(/ed$/)){
			try_word(str.replace(/ed$/,''));
			try_word(str.replace(/d$/,''));
		}
		
		if(str.match(/ies$/)){
			try_word(str.replace(/ies$/,'y'));
		}

		if(str.match(/ier$/)){
			try_word(str.replace(/ier$/,'y'));
		}

		if(str.match(/er$/)){
			try_word(str.replace(/er$/,''));
		}
		if(str.match(/iest$/)){
			try_word(str.replace(/iest$/,'y'));
		}

		if(str.match(/est$/)){
			try_word(str.replace(/est$/,''));
		}

		if(str.match(/s$/)){
			try_word(str.replace(/s$/,''));
		}

		if(str.match(/nning$/)){
			try_word(str.replace(/nning$/,'n'));
		}else if(str.match(/ing$/)){
			try_word(str.replace(/ing$/,''));
		}
		
		var cnt=0;
		while(expandRangeToNextWord(range)&& cnt<5){
			cnt++;
			str=range.toString();
			try_phrase(str);
		}

		doc.write(docdat);
		if(match_count==0){
			if(!key.match(/[^A-Za-z0-9\s]/) ){
				doc.write('<div class="key">'+key+'</div>');
				doc.write('<div class="error">No match in dictionary.</div>');
			}
		}
	}
	doc.write('</font>');
	doc.close();
	mDBConn.executeSimpleSQL("COMMIT TRANSACTION");
}

function expandRangeToWord (range) {
  var startOfWord = /^[^\w\-][\w\-]+$/;
  var endOfWord = /^[\w\-]+[^\w\-]$/;
  var whitespace = /^\s+$/;
  var flag=0;

  range.setStart(range.startContainer, range.startOffset - 1);
  while (whitespace.test(range.toString())) {
    range.setEnd(range.endContainer, range.endOffset + 1);
    range.setStart(range.startContainer, range.startOffset + 1);
  }
  while (!startOfWord.test(range.toString())) {
  	try{
    range.setStart(range.startContainer, range.startOffset - 1);
    }catch(err){
    	flag=1;
    	break;
    }
  }
	if(flag!=1){
	  range.setStart(range.startContainer, range.startOffset + 1);
	}else{
	  flag=0;
	}
  while (!endOfWord.test(range.toString())) {
	try{
   		range.setEnd(range.endContainer, range.endOffset + 1);
   	}catch(err){
    	flag=1;
   		break;
   	}
  }
  if(flag!=1){
  	range.setEnd(range.endContainer, range.endOffset - 1);
  	return true;
  }else{
  	  return false;
  }
}

function expandRangeToNextWord(range)
{
  var endOfWord = /[\w\-]+[^\w\-]$/;
  var whitespace = /[\s\n\r]$/;
  var flag=0;
	
  try{
   	range.setEnd(range.endContainer, range.endOffset + 1);
  }catch(err){
   	return false;
  }
  
  while (whitespace.test(range.toString())) {
  	cnt++;
	try{
   		range.setEnd(range.endContainer, range.endOffset + 1);
   	}catch(err){
    	flag=1;
   		break;
   	}
  }


  var cnt=0;
  while (!endOfWord.test(range.toString())) {
  	cnt++;
	try{
   		range.setEnd(range.endContainer, range.endOffset + 1);
   	}catch(err){
    	flag=1;
   		break;
   	}
  }
  if(cnt==0) return false;
  if(flag!=1){
     range.setEnd(range.endContainer, range.endOffset - 1);
  }
  return true;
}
