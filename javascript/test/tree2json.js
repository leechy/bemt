describe("Line Parser", function() {
	it("parses single empty element", function() {
		var result = bemt.tree2json(
			[
				{
					string: "wbr"
				}
			]
		);
		var correctAnswer = [
			{
				"t": "wbr"
			}
		]
		expect(result).toEqual(correctAnswer);
	});

	it("parses single line element with text content", function() {
		var result = bemt.tree2json(
			[
				{
					string: "title Hello, World!"
				}
			]
		);
		var correctAnswer = [
			{
				"t": "title",
				"c": "Hello, World!"
			}
		]
		expect(result).toEqual(correctAnswer);
	});

	it("parses single line element with quoted attribute", function() {
		var result = bemt.tree2json(
			[
				{
					string: 'a @href="http://ya.ru/" Hello, World!'
				}
			]
		);
		var correctAnswer = [
			{
				"t": "a",
				"a": {
					"href": "http://ya.ru/"
				},
				"c": "Hello, World!"
			}
		]
		expect(result).toEqual(correctAnswer);
	});

	it("parses single line element with unquoted attribute", function() {
		var result = bemt.tree2json(
			[
				{
					string: 'a @href=http://ya.ru/ Hello, World!'
				}
			]
		);
		var correctAnswer = [
			{
				"t": "a",
				"a": {
					"href": "http://ya.ru/"
				},
				"c": "Hello, World!"
			}
		]
		expect(result).toEqual(correctAnswer);
	});

	it("parses element with nested text", function() {
		var result = bemt.tree2json(
			[
				{
					string: 'a @href=http://ya.ru/',
					children: [
						{ string: '| Hello, World!' }
					]
				}
			]
		);
		var correctAnswer = [
			{
				"t": "a",
				"a": {
					"href": "http://ya.ru/"
				},
				"c": "Hello, World!"
			}
		]
		expect(result).toEqual(correctAnswer);
	});

	it("parses element with nested attribute", function() {
		var result = bemt.tree2json(
			[
				{
					string: 'a Hello, World!',
					children: [
						{ string: '@href=http://ya.ru/' }
					]
				}
			]
		);
		var correctAnswer = [
			{
				"t": "a",
				"a": {
					"href": "http://ya.ru/"
				},
				"c": "Hello, World!"
			}
		]
		expect(result).toEqual(correctAnswer);
	});

	it("parses element with attribute, nested attribute and text", function() {
		var result = bemt.tree2json(
			[
				{
					string: 'a @target="_blank"',
					children: [
						{ string: '| Hello, World!' },
						{ string: '@href=http://ya.ru/' }
					]
				}
			]
		);
		var correctAnswer = [
			{
				"t": "a",
				"a": {
					"href": "http://ya.ru/",
					"target": "_blank"
				},
				"c": "Hello, World!"
			}
		]
		expect(result).toEqual(correctAnswer);
	});

	it("inserts empty attribute", function() {
		var result = bemt.tree2json(
			[
				{
					string: 'td @nowrap @colspan="3"'
				}
			]
		);
		var correctAnswer = [
			{
				"t": "td",
				"a": {
					"nowrap": "",
					"colspan": "3"
				}
			}
		]
		expect(result).toEqual(correctAnswer);
	});

	it("parses element with nested multyline text", function() {
		var result = bemt.tree2json(
			[
				{
					string: 'a @href=http://ya.ru/',
					children: [
						{ string: '| Hello,' },
						{ string: '| World!' }
					]
				}
			]
		);
		var correctAnswer = [
			{
				"t": "a",
				"a": {
					"href": "http://ya.ru/"
				},
				"c": "Hello, World!"
			}
		]
		expect(result).toEqual(correctAnswer);
	});

	it("parses one child non text element", function() {
		var result = bemt.tree2json(
			[
				{
					string: 'div',
					children: [
						{ string: 'p Hello, World!' }
					]
				}
			]
		);
		var correctAnswer = [
			{
				"t": "div",
				"c": [
					{
						"t": "p",
						"c": "Hello, World!"
					}
				]
			}
		]
		expect(result).toEqual(correctAnswer);
	});

	it("parses couple child non text element", function() {
		var result = bemt.tree2json(
			[
				{
					string: 'section',
					children: [
						{ string: 'h1 Hello, World!' },
						{ string: 'p Bem^templates are here!' }
					]
				}
			]
		);
		var correctAnswer = [
			{
				"t": "section",
				"c": [
					{
						"t": "h1",
						"c": "Hello, World!"
					},
					{
						"t": "p",
						"c": "Bem^templates are here!"
					}
				]
			}
		]
		expect(result).toEqual(correctAnswer);
	});

	it("parses text content and a child element after it", function() {
		var result = bemt.tree2json(
			[
				{
					string: 'a @href="http://ya.ru/" Яндекс',
					children: [
						{ string: 'span краткая версия' }
					]
				}
			]
		);
		var correctAnswer = [
			{
				"t": "a",
				"a": {
					"href": "http://ya.ru/"
				},
				"c": [
					"Яндекс",
					{
						"t": "span",
						"c": "краткая версия"
					}
				]
			}
		]
		expect(result).toEqual(correctAnswer);
	});

	it("parses mixed text content and a children elements", function() {
		var result = bemt.tree2json(
			[
				{
					string: 'a @href="http://ya.ru/"',
					children: [
						{ string: 'span Краткая версия' },
						{ string: '| Яндекса' },
						{
							string: 'span @class=new-window',
							children: [
								{ string: '| в новом окне' }
							]
						},
						{ string: '@target=_blank' },
						{ string: '| вот так!' },
					]
				}
			]
		);
		var correctAnswer = [
			{
				"t": "a",
				"a": {
					"href": "http://ya.ru/",
					"target": "_blank"
				},
				"c": [
					{
						"t": "span",
						"c": "Краткая версия"
					},
					"Яндекса",
					{
						"t": "span",
						"a": {
							"class": "new-window"
						},
						"c": "в новом окне"
					},
					"вот так!"
				]
			}
		]
		expect(result).toEqual(correctAnswer);
	});

	it("parses block name correctly", function() {
		var result = bemt.tree2json([
			{
				string: 'a @b:b-link @href="http://www.yandex.ru/" Яндекс'
			}
		]);
		var correctAnswer = [
			{
				"t": "a",
				"b": "b-link",
				"a": {
					"href": "http://www.yandex.ru/"
				},
				"c": "Яндекс"
			}
		]
		expect(result).toEqual(correctAnswer);
	});

	it("on empty block name sets '^templateName' keyword", function() {
		var result = bemt.tree2json([
			{
				string: 'a @b @href="http://www.yandex.ru/" Яндекс'
			}
		]);
		var correctAnswer = [
			{
				"t": "a",
				"b": "^templateName",
				"a": {
					"href": "http://www.yandex.ru/"
				},
				"c": "Яндекс"
			}
		]
		expect(result).toEqual(correctAnswer);
	});

	it("parses element name correctly", function() {
		var result = bemt.tree2json([
			{
				string: 'div @b:search-engine',
				children: [
					{ string: 'a @e:link @href="http://ya.ru/" Яндекс' }
				]
			}
		]);
		var correctAnswer = [
			{
				"t": "div",
				"b": "search-engine",
				"c": [
					{
						"t": "a",
						"e": "link",
						"a": {
							"href": "http://ya.ru/"
						},
						"c": "Яндекс"
					}
				]
			}
		]
		expect(result).toEqual(correctAnswer);
	});

	it("parses element name correctly from substring", function() {
		var result = bemt.tree2json([
			{
				string: 'div @b:search-engine',
				children: [
					{
						string: 'a Яндекс',
						children: [
							{ string: '@href="http://ya.ru/"' },
							{ string: '@e:link' }
						]
					}
				]
			}
		]);
		var correctAnswer = [
			{
				"t": "div",
				"b": "search-engine",
				"c": [
					{
						"t": "a",
						"e": "link",
						"a": {
							"href": "http://ya.ru/"
						},
						"c": "Яндекс"
					}
				]
			}
		]
		expect(result).toEqual(correctAnswer);
	});

	it("parses one posible modifier", function() {
		var result = bemt.tree2json([
			{
				string: 'div @b:cloud @m:theme'
			}
		]);
		var correctAnswer = [
			{
				"t": "div",
				"b": "cloud",
				"m": ["theme"]
			}
		]
		expect(result).toEqual(correctAnswer);
	});

	it("parses several posible modifiers", function() {
		var result = bemt.tree2json([
			{
				string: 'div @b:cloud @m:theme @m:state @m:selected'
			}
		]);
		var correctAnswer = [
			{
				"t": "div",
				"b": "cloud",
				"m": ["theme", "state", "selected"]
			}
		]
		expect(result).toEqual(correctAnswer);
	});

	it("parses several posible modifiers on substrings", function() {
		var result = bemt.tree2json([
			{
				string: 'div @b:cloud @m:theme @m:state',
				children: [
					{ string: '@m:selected' }
				]
			}
		]);
		var correctAnswer = [
			{
				"t": "div",
				"b": "cloud",
				"m": ["theme", "state", "selected"]
			}
		]
		expect(result).toEqual(correctAnswer);
	});
});
