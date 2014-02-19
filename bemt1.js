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
        var reTokenSplit = /([^"\s]*("[^"]*")[^"\s]*)|[^"\s]+/g,
        	reTrimQuotes = /^"|"$/g;

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

        	// template block keyword
        	blockFromTemplate: '^templateName',

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
        	emptyTag: '|area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr|!doctype|!DOCTYPE|',
        	omitEndTag: '|colgroup|dd|dt|li|optgroup|option|p|rp|rt|tbody|td|tfoot|tr|',
        	spaceSeparatedAttrs: '|class|',

        	dontIndentContents: '|title|h1|h2|h3|h4|h5|h6|p|', // block elements, containing phrasing elements
        	dontIndent: '|span|b|i|s|' // inline elements
        }

        // utility functions
        function isEmpty(obj) {
        	// null and undefined are empty
   			if (obj == null) return true;
   			// Assume if it has a length property with a non-zero value
			// that that property is correct.
			if (obj.length && obj.length > 0) {
				return false;
			}
			if (obj.length === 0) {
				return true;
			}
   			for (var key in obj) {
   				if (hasOwnProperty.call(obj, key)) {
   					return false;
   				}
   			}
   			return true;
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

		function tree2json(json, params, parent) {
			var resultsArray = [];

			function parseString(string, parent) {
				var current = {},
					parent = parent || null,
					attachToParent = false;

				function appendText(string, property) {
					if (property && property.length) {
						return property + ' ' + string;
					} else {
						return string;
					}
				}

				function appendToLastTag(collection, attrName, attrValue, asArray) {
					if (!current.t && parent.t) {
						if (attrValue != null) {
							if (!parent[collection]) {
								parent[collection] = {};
							}
							parent[collection][attrName] = attrValue;
						} else {
							if (asArray) {
								if (!parent[collection]) {
									parent[collection] = [];
								}
								parent[collection].push(attrName);
							} else {
								parent[collection] = attrName;
							}
						}
					} else {
						if (attrValue != null) {
							if (!current[collection]) {
								current[collection] = {};
							}
							current[collection][attrName] = attrValue;
						} else {
							if (asArray) {
								if (!current[collection]) {
									current[collection] = [];
								}
								current[collection].push(attrName);
							} else {
								current[collection] = attrName;
							}
						}
					}
				}

				// spliting by spces (not )
				var tokens = string.match(reTokenSplit);
				// console.log('tokens', tokens);

				// determine what each token stands for
				// the only problem is with the first one –
				// it can be a html tag, a pipe, or command
				for (var i = 0, len = tokens.length; i < len; i++) {
					switch (tokens[i].substr(0,1)) {
						case "@":
							var isAttr = true;
							
							// attribute (can be a BEM one)
							var attrArr = tokens[i].split('=')

							// deal with value first – it's easier
							var attrValue = '';
							if (attrArr[1]) {
								attrValue = attrArr[1].replace(reTrimQuotes, '');
							}

							// then the name of the attribute
							var attrName = attrArr[0].substring(1);

							// check for plus/minus at the end


							// check for BEM namespace
								// block
							if (attrArr[0].indexOf('@b:') == 0) {
								// it's a block with a name
								isAttr = false;
								appendToLastTag("b", attrArr[0].substr(3), null);
							} else if (attrArr[0].indexOf('@b') == 0) {
								// empty block
								isAttr = false;
								appendToLastTag("b", settings.blockFromTemplate, null);
							}
								// element
							if (attrArr[0].indexOf('@e:') == 0) {
								// it's a block with a name
								isAttr = false;
								appendToLastTag("e", attrArr[0].substr(3), null);
							} else if (attrArr[0].indexOf('@e') == 0) {
								// empty block
								isAttr = false;
								appendToLastTag("e", settings.blockFromTemplate, null);
							}
								// modifiers
							if (attrArr[0].indexOf('@m:') == 0) {
								// it's a block with a name
								isAttr = false;
								appendToLastTag("m", attrArr[0].substr(3), null, true);
							}

							
							// append attribute ...
							if (isAttr) {
								appendToLastTag("a", attrName, attrValue);
							}
							break;
						case "|":
							// text line – should be added to parent object
							attachToParent = true;
							break;
						case "^":
							// command
							break;
						case "$":
							// param call
							break;
						case "-":
							// param set
							break;
						default:
							if (i == 0) {
								// tag
								current.t = tokens[i];
								// set flag to collect children in right order
								if (parent && !parent.c) parent.haveChildren = true;
							} else {
								// text line
								if (attachToParent && parent && !current.c) {
									// if we can attach to parent and there is no current content
									if (parent.haveChildren) {
										var restOfTheString = tokens[i];
										for (var j = i + 1; j < len; j++) {
											restOfTheString += ' ' + tokens[j];
										}
										return restOfTheString;
									} else if (!parent.c || typeof parent.c === 'string') {
										parent.c = appendText(tokens[i], parent.c);
									} else {
										parent.c.push(tokens[i]);
									}
								} else {
									if (!current.c || typeof current.c === 'string') {
										current.c = appendText(tokens[i], current.c);
									} else {
										current.c.push(tokens[i]);
									}

								}
							}
					}
				}
				return current;
			}

			for (var i in json) {
				var next = resultsArray.length;
				var stringObj = parseString(json[i].string, parent);
				if (!isEmpty(stringObj)) {
					resultsArray[next] = stringObj;
				}
				if (json[i].children) {
					var childArray = tree2json(json[i].children, params, resultsArray[next]);
					// remove haveChildren flag (to satisfy tests)
					if (!isEmpty(childArray)) {
						if (resultsArray[next].c) {
							if (typeof resultsArray[next].c === 'string') {
								var currentString = resultsArray[next].c;
								resultsArray[next].c = [];
								resultsArray[next].c.push(currentString);
								for (var child = 0; child < childArray.length; child++) {
									resultsArray[next].c.push(childArray[child]);
								}
							}
						} else {
							resultsArray[next].c = childArray;	
						}
					}
				}
			}
			// remove service flag haveChildren
			for (var child = 0, childArrayLength = resultsArray.length; child < childArrayLength; child++) {
				delete resultsArray[child].haveChildren;
			}
			return resultsArray;
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

			if (typeof json === 'string') {
				if (settings.indent) {
					resultsArray.push(indentSize + json + '\n');
				} else {
					resultsArray.push(json);
				}
			} else if (json.length) {
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
						if (attrs[attr] === '') {
							resultsArray.push(' ' + attr);
						} else {
							resultsArray.push(' ' + attr + '="' + attrs[attr] + '"');
						}
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