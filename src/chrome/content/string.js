/*
 * Copyright (c) 2006 Ichro Maruta
 * Copyright (c) 2017 wtetsu
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

if (typeof(md) === "undefined") {
  md = {};
}

md.string = {};

md.string._isStrCapital = function(str) {
  return /^[A-Z]$/.test(str);
};

md.string._splitString = function(str) {
  var arr = [];
  var startIndex = 0;
  var i = 0;
  var len = str.length;
  var isLastCapital = true;
  for (;;) {
    if (i >= len) {
      break;
    }
    var ch = str[i];
    var isCapital = md.string._isStrCapital(ch);
    if (ch === "-" || ch === "_") {
      arr.push(str.substring(startIndex, i));
      startIndex = i+1;
    } else if (isCapital && !isLastCapital) {
      arr.push(str.substring(startIndex, i));
      startIndex = i;
    } else {
      isLastCapital = isCapital;
    }
    i += 1;
  }
  if (startIndex > 0) {
    arr.push(str.substring(startIndex));
  }

  return arr;
};

md.string.parseString = function(str) {
  var result = [];
  if (str) {
    result.push(str);
    var arr = md.string._splitString(str);
    var i, len;
    for (i = 0, len = arr.length; i < len; i++) {
      result.push(arr[i]);
    }
  }

  return result;
};

md.string.transformWord = function(str) {
  var words = [];

  var strList = md.string.parseString(str);
  var i, len;
  for (i = 0, len = strList.length; i < len; i++) {
    var newWords = md.string._transformWord(strList[i]);
    words = words.concat(newWords);
  }
  return words;
};

md.string._transformWord = function(str) {
  var words = [str];
  if (str != str.toLowerCase()) {
    words.push(str.toLowerCase());
  }
  if (str.match(/ied$/)) {
    words.push(str.replace(/ied$/,'y'));
  }
  if (str.match(/ed$/)) {
    words.push(str.replace(/ed$/,''));
    words.push(str.replace(/d$/,''));
  }
  if (str.match(/ies$/)) {
    words.push(str.replace(/ies$/,'y'));
  }
  if (str.match(/ier$/)) {
    words.push(str.replace(/ier$/,'y'));
  }
  if (str.match(/er$/)) {
    words.push(str.replace(/er$/,''));
  }
  if (str.match(/iest$/)) {
    words.push(str.replace(/iest$/,'y'));
  }
  if (str.match(/est$/)) {
    words.push(str.replace(/est$/,''));
  }
  if (str.match(/s$/)) {
    words.push(str.replace(/s$/,''));
  }
  if (str.match(/nning$/)) {
    words.push(str.replace(/nning$/,'n'));
  } else if (str.match(/ing$/)) {
    words.push(str.replace(/ing$/,''));
  }
  return words;
};

// for test
if (typeof(module) !== "undefined") {
  module.exports.string = md.string;
}
