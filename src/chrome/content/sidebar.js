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

function font_announce()
{
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                getService(Components.interfaces.nsIPrefBranch);
	var sidebar=top.document.getElementById("sidebar");
	var result = sidebar.contentDocument.getElementById("result");
	var doc=result.contentDocument;
	doc.open();
	doc.write('<style type=text/css>div.key{color:#000088;font-weight:bold;}div.error{color:red;font-weight:bold;}div.desc{font-size:small;}span.annote{color:green;}span.ex{color:orange;}</style>');
	var fontsize=prefs.getIntPref("extensions.mousedictionary.sidebar_font_size");
	if(fontsize<0){
		fontsize=fontsize+"";
	}else{
		fontsize="+"+fontsize;
	}
	doc.write('<font size='+fontsize+'>');
	doc.write('<div class="key">font size has changed.</div>');
	doc.write('<div class="error">フォントサイズが変更されました。</div>');
	doc.write('</font>');
	doc.close();

}

function font_enlarge()
{
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                getService(Components.interfaces.nsIPrefBranch);
    var fontsize=prefs.getIntPref("extensions.mousedictionary.sidebar_font_size");
    prefs.setIntPref("extensions.mousedictionary.sidebar_font_size",fontsize+1);
    font_announce();
}

function font_reduce()
{
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                getService(Components.interfaces.nsIPrefBranch);
    var fontsize=prefs.getIntPref("extensions.mousedictionary.sidebar_font_size");
    prefs.setIntPref("extensions.mousedictionary.sidebar_font_size",fontsize-1);
    font_announce();
}

function font_normal()
{
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                getService(Components.interfaces.nsIPrefBranch);
    prefs.setIntPref("extensions.mousedictionary.sidebar_font_size",0);
    font_announce();
}
