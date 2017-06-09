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

md.misc = {};

md.misc.expandRangeToWord = function(range) {
  var startOfWord = /^[^\w\-][\w\-]+$/;
  var endOfWord = /^[\w\-]+[^\w\-]$/;
  var whitespace = /^\s+$/;
  var flag = 0;

  range.setStart(range.startContainer, range.startOffset - 1);
  while (whitespace.test(range.toString())) {
    range.setEnd(range.endContainer, range.endOffset + 1);
    range.setStart(range.startContainer, range.startOffset + 1);
  }
  while (!startOfWord.test(range.toString())) {
    try {
      range.setStart(range.startContainer, range.startOffset - 1);
    } catch(err) {
      flag = 1;
      break;
    }
  }
  if (flag != 1) {
    range.setStart(range.startContainer, range.startOffset + 1);
  } else {
    flag = 0;
  }
  while (!endOfWord.test(range.toString())) {
    try {
       range.setEnd(range.endContainer, range.endOffset + 1);
     } catch(err) {
      flag = 1;
       break;
     }
  }
  if (flag !== 1) {
    range.setEnd(range.endContainer, range.endOffset - 1);
    return true;
  } else {
    return false;
  }
};

md.misc.expandRangeToNextWord = function(range) {
  var endOfWord = /[\w\-]+[^\w\-]$/;
  var whitespace = /[\s\n\r]$/;
  var flag = 0;

  try {
     range.setEnd(range.endContainer, range.endOffset + 1);
  } catch(err) {
     return false;
  }

  while (whitespace.test(range.toString())) {
    cnt++;
    try {
       range.setEnd(range.endContainer, range.endOffset + 1);
     } catch(err) {
      flag = 1;
       break;
     }
  }

  var cnt = 0;
  while (!endOfWord.test(range.toString())) {
    cnt++;
    try {
       range.setEnd(range.endContainer, range.endOffset + 1);
     } catch(err) {
      flag = 1;
       break;
     }
  }
  if (cnt === 0) {
    return false;
  }
  if (flag != 1) {
   range.setEnd(range.endContainer, range.endOffset - 1);
  }
  return true;
};
