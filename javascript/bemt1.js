function prettyPrint(json) {
    // if (window.console) console.log(json);
    
    function branch(obj, offset, last) {
        var output = '';
        if (typeof(obj) == 'object') {
            if (obj.length) {
                // array
                output += '[\n';
                for (var i in obj) {
                    output += branch(obj[i], offset + '  ', i == obj.length - 1);
                }
                output += offset + ']\n';
            } else {
                // object
                output += offset + '{\n';
                for (var i in obj) {
                    output += offset + '  "' + i + '": ' + branch(obj[i], offset + '  ');
                }
                output += offset + '}';
                if (!last) output += ',';
                output += '\n';
            }
        } else {
            output += '"' + obj + '"\n';
        }
        return output;
    }
    
    var output = branch(json, '');
    return output;
}




(function(global) {
	var bemt = function() {
        var reTokenSplit = /([^"\s]*("[^"]*")[^"\s]*)|[^"\s]+/g;

        var syntax = {
        	split: '|'
        }

        // global settings
        // change via set method
        var settings = {
        	// output
        	mode: "html", // available "html", "xml", "text"?
        	indent: false, // 
        	indentSize: '    ',

        	// bem syntax
        	elementPrefix: '__',
        	modifierPrefix: '_',
        	modifierDelimiter: '_',

        	// dev tools
        	debug: false, // adds line/token positions in json and throws warnings if smth goes wrong
        	console: null // custom console object
        }

        function set(params) {
        	for (var param in params) {
        		if (settings[param] != null) {
        			// changing only existing params (don't know why ;-))
        			settings[param] = params[param];
        		}
        	}
        }

        var html = {
        	optionalTag: '|html|head|body|tbody|',
        	emptyTag: '|area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr|',
        	omitEndTag: '|colgroup|dd|dt|li|optgroup|option|p|rp|rt|tbody|td|tfoot|tr|',
        	spaceSeparatedAttrs: '|class|',

        	dontIndentContents: '|h1|h2|h3|h4|h5|h6|p|', // block elements, containing phrasing elements
        	dontIndent: '|span|b|i|s|' // inline elements
        }

		function parseTree(source) {
	        var reNotEmpty = /\S/,
	            reOffset = /^(\s+)(.*)/,
	            reTrim = /^\s+|\s+$/g,
	        	reSplit = /([^"\|]*("[^"]*")[^"\|]*)|[^"\|]+/g, // todo: нужно генерить регексп на основе syntax.split!
 				linesArray = [], // source, splitted by newline symbol
				resultsArray = [], // json with tree-like structure
					// [{ string: 'parent 1', children: [{ string: 'children', ... }] }, { string: 'parent 2' }]
				offsetsArray = [], // array with all ancestor offsets to the current line
					// [{ node: *pointer to resultsArray node*, offset: '  ' }, { node: *pointer to resultsArray node*, offset: '    ' }]
				currentLine = 0;

			// helper functions
			function setOffset(current, parent, offset, position, isSplit) {
				offsetsArray.length = position || 0;
				if (isSplit) {
					offsetsArray.push({
						node: parent,
						offset: offset,
						current: current
					});
				} else {
					offsetsArray.push({
						node: current,
						offset: offset,
						current: current
					});
				}
			}

			function appendLine(string, offset, parent, parentOffsetIdx, isSplit) {
				var lineArray = resultsArray;
				if (parent) {
					// if parent has no children array - create one
					if (!parent.children) {
						parent.children = [];
					}
					lineArray = parent.children;
				}
				var line = {
					string: string
				}
				if (settings.debug) {
					line.lineNo = currentLine;
				}
				var len = lineArray.push(line);

				// add new offset to offsetsArray, at the parent position
				setOffset(lineArray[len - 1], parent, offset, parentOffsetIdx, isSplit);
			}

			function getParent(offset, isSplit) {
				var parent = null,
				    idx = 0;

				// checking for the parent from the end of the offsetsArray to the top
				for (var j = offsetsArray.length - 1; j >= 0; j--) {
					// if there is an offset like this – create sibling (child of the parent)
					if (offset === offsetsArray[j].offset) {
						if (isSplit) {
							parent = offsetsArray[j].current;
						} else if (offsetsArray[j - 1]) {
							parent = offsetsArray[j - 1].node;
						} else {
							parent = null;
						}
						idx = j;
						break;
					}
					// if it's not equal, but there is an offset which starts like current - create child
					if (offset.indexOf(offsetsArray[j].offset) == 0) {
						parent = offsetsArray[j].current;
						idx = j + 1;
						break;
					}
				}

				return {
					parent: parent,
					idx: idx
				}
			}

			// splitting templateText to an array
			linesArray = source.split('\n');

			// iterate over all lines
			for (var i = 0, len = linesArray.length; i < len; i++) {
				var line = linesArray[i];
				currentLine = i + 1;
				// ignore empty lines
				if (!reNotEmpty.test(line)) continue;

				// get line offset
				var offsetMatch = line.match(reOffset);

				if (offsetMatch) {
					var offset = offsetMatch[1],
						string = offsetMatch[2];

					var offsetParent = getParent(offset, false);

					if (string.indexOf(syntax.split) > 0) { // проверить, почему не сработало с '    | text' ?
						// split lines by |
						var splitArray = string.match(reSplit);
						var isText = false;
						for (var k = 0, klen = splitArray.length; k < klen; k++) {
							var stringPart = splitArray[k].replace(reTrim, '');

							offsetParent = getParent(offset, true);

							if (k == 0 && stringPart == '') {
								isText = true;
							} else {
								if (isText == true) {
									stringPart = syntax.split + stringPart;
									isText = false;
								}
								appendLine(stringPart, offset, offsetParent.parent, offsetParent.idx, !isText);
							}
						}
					} else {
						appendLine(string, offset, offsetParent.parent, offsetParent.idx);
					}
				} else {
					// if there was no offset – create new root branch
					appendLine(line, '');
				}
			}
			return resultsArray;
		}

		function tree2json(json, params) {
			
		}

		function json2html(json, params, block, mods, parentAttrs, parentTag, indentSize) {
			var resultsArray = [],
				block = json.b || block,
				attrs = {},
				contents = [],
				params = params || {},
				parentTag = parentTag || null,
				indentSize = indentSize || '',
				indentOuter = false,
				indentInner = false;


			function addAttribute(name, value, attrs) {
				if (name.indexOf('=') > 0) {
					var realName = name.substr(0, name.indexOf('='));
					switch (name.substr(name.indexOf('=') + 1)) {
						case '+':
							if (attrs[realName] && attrs[realName].length) {
								if (html.spaceSeparatedAttrs.indexOf('|' + realName + '|') >= 0) {
									attrs[realName] += ' ';
								}
								attrs[realName] += value;
							} else {
								attrs[realName] = value;
							}
							break;
						case '-':
							var val = ' ' + attrs[realName] + ' ';
							attrs[realName] = val.replace(' ' + value + ' ', '').trim();
							break;
					}
				} else {
					attrs[name] = value;
				}
			}

			function getAttributes(attributes, params, attrs) {
				for (var attr in attributes) {
					addAttribute(attr, attributes[attr], attrs);
				}
			}

			function getContent(json, params, block, mods, parentAttrs, parentTag, indentSize) {
				if (typeof json === 'string') {
					// if it's string – just return it
					if (settings.indent) {
						if (html.dontIndentContents.indexOf('|' + parentTag + '|') >= 0) {
							return json;
						} else {
							return indentSize + json + '\n';
						}
					} else {
						return json;
					}
				} else {
					// if it's an array or object – parse it by the parent method
					return json2html(json, params, block, mods, parentAttrs, parentTag, indentSize);
				}
			}

			if (json.length) {
				for (var i in json) {
					if (json.t) {
						resultsArray.push(json2html(json[i], params, block, mods, attrs, parentTag, indentSize));
					} else {
						resultsArray.push(json2html(json[i], params, block, mods, parentAttrs, parentTag, indentSize));
					}
				}
			} else {
				if (json.t) {
					// save the last parent tag
					parentTag = json.t;

					// outer indentation
					if (settings.indent && html.dontIndent.indexOf('|' + json.t + '|') < 0) {
						indentOuter = true;
						resultsArray.push(indentSize);
					}

					// tag
					resultsArray.push('<' + json.t);

					// recalculate indentSize
					if (settings.indent && html.dontIndentContents.indexOf('|' + json.t + '|') < 0) {
						indentInner = true;
						indentSize += settings.indentSize;
					}

				}
				// attributes
				if (json.a) {
					if (json.t) {
						getAttributes(json.a, params, attrs);
					} else {
						getAttributes(json.a, params, parentAttrs);
					}
				}
				if (json.b) {
					addAttribute('class', json.b, attrs);
				}
				if (json.e) {
					if (block) {
						addAttribute('class=+', block + settings.elementPrefix + json.e, attrs);
					}
				}
				if (json.mods) {
					if (!params.mods) {
						params.mods = {};
					}
					for (var mod in json.mods) {
						params.mods[mod] = json.mods[mod];
					}
				}
				if (json.m) {
					for (var i = 0; i < json.m.length; i++) {
						var mod = json.m[i];
						var modClass = null;
						if (json.mods && json.mods[mod]) {
							modClass = settings.modifierPrefix + mod + settings.modifierDelimiter + json.mods[mod];
						}
						if (params.mods && params.mods[mod]) {
							modClass = settings.modifierPrefix + mod + settings.modifierDelimiter + params.mods[mod];
						}
						if (modClass) {
							if (json.b) {
								addAttribute('class=+', block + modClass, attrs);
							}
							if (json.e) {
								addAttribute('class=+', block + settings.elementPrefix + json.e + modClass, attrs);
							}
						}
					}
				}
				if (json.c) {
					// get contents in separate array (they can change attributes)
					var content = getContent(json.c, params, block, mods, attrs, parentTag, indentSize);
				}
				if (json.t) {
					// push attributes
					for (var attr in attrs) {
						resultsArray.push(' ' + attr + '="' + attrs[attr] + '"');
					}
					// close tag
					resultsArray.push('>');
					// indent if it's not the dontIndentContents tag
					if (indentInner) {
						resultsArray.push('\n');
					}
				}
				// push contents
				resultsArray.push(content);
				// close tag (if applicable)
				if (json.t && html.emptyTag.indexOf('|' + json.t + '|') < 0) {
					if (indentInner) {
						indentSize = indentSize.substr(0, indentSize.lastIndexOf(settings.indentSize));
						resultsArray.push(indentSize);
					}
					resultsArray.push('</' + json.t + '>');
					if (indentOuter) {
						resultsArray.push('\n');
					}
				}
			}
			return resultsArray.join('');
		}

		return {
			parseTree: parseTree,
			tree2json: tree2json,
			json2html: json2html,
			set: set
		}
	}

	if (!global.bemt) {
		global.bemt = new bemt();
	}
})(typeof window === 'undefined' ? this : window);