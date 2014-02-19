/*!
 * Bem^Templates
 * Copyright(c) 2013 Andreyka Lechev <leechy@leechy.ru>
 */

var bemt = {

    // parse tree
    parseTree: function(linesArray) {
        var
            resultArray = [],
            offsetsArray = [],
            currentNode = null,
            currentOffset = '';
            reNotEmpty: /\S/,
            reOffset: /^(\s+)(.*)/;

        function createNewNode(string, offset, parentNode, offsetIdx) {
            if (parentNode) {
                if (!parentNode.children) {
                    parentNode.children = [];
                }
                var idx = parentNode.children.push({
                    string: string
                });
                // put node to offsets array
                offsetsArray.length = offsetIdx;
                offsetsArray.push({node: parentNode.children[idx - 1], offset: offset});
            } else {
                // if there is not parent - create new root node
                var idx = resultArray.push({
                    string: string
                });
                // clear offsets to start
                offsetsArray.length = 0;
                offsetsArray.push({node: resultArray[idx - 1], offset: offset});
            }
        }

        for (var i in linesArray) {
            var line = linesArray[i];
            // ignore empty strings
            if (!bemt.reNotEmpty.test(line)) continue;

            // get line offset (if any)
            var offsetMatch = line.match(bemt.reOffset);

            if (offsetMatch) {
                var
                    lineOffset = offsetMatch[1],
                    string = offsetMatch[2];
                // if there is an offset... we should check who's the parent
                for (var j = offsetsArray.length - 1; j >= 0; j--) {
                    if (lineOffset === offsetsArray[j].offset) {
                        // create sibling
                        createNewNode(string, lineOffset, offsetsArray[j - 1].node, j);
                        break;
                    } else if (lineOffset.indexOf(offsetsArray[j].offset) == 0) {
                        // create child
                        createNewNode(string, lineOffset, offsetsArray[j].node, j + 1);
                        break;
                    }
                }
            } else {
                // create root node
                createNewNode(line, '', null, 0);
            }
        }

        return resultArray;
    }


}