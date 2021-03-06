describe("Tree Parser", function() {
	it("can follow simple nesting", function() {
		var result = bemt.parseTree('section\n  div\n    p\n      span');
		var correct = [
			{
				string : 'section',
				children : [
					{
						string : 'div',
						children : [
							{
								string : 'p',
								children : [
									{ string : 'span' }
								]
							}
						]
					}
				]
			}
		];
		expect(result).toEqual(correct);
	});

	it("skips empty lines", function() {
		var result = bemt.parseTree('section\n\n  div\n\nsection');
		var correct = [
			{
				string: 'section',
				children: [
					{ string: 'div' }
				]
			},
			{ string : 'section' }
		]
		expect(result).toEqual(correct);
	});

	it("can ignore offset of the first level nodes", function() {
		var result = bemt.parseTree(' section\n   div\n section\nsection');
		var correct = [
			{
				string: 'section',
				children: [
					{ string: 'div' }
				]
			},
			{ string : 'section' },
			{ string : 'section' }
		]
		expect(result).toEqual(correct);
	});

	it("understands both tabs and spaces for offset, even mixed", function() {
		var result = bemt.parseTree('section\n \tdiv\n \t  | text\n  div\nsection');
		var correct = [
			{
				string: 'section',
				children: [
					{
						string: 'div',
						children: [
							{ string: '| text' }
						]
					},
					{ string: 'div' }
				]
			},
			{ string : 'section' }
		]
		expect(result).toEqual(correct);
	});

	it("does inline split with proper siblings and children handling", function() {
		var result = bemt.parseTree('section\n  div | a @href="/" | span "text | with | pipes"\n    | new line text\n  div\nsection');
		var correct = [
			{
				string: 'section',
				children: [
					{
						string: 'div',
						children: [
							{
								string: 'a @href="/"',
								children: [
									{
										string: 'span "text | with | pipes"',
										children: [
											{ string: '| new line text' }
										]
									}
								]
							}
						]
					},
					{ string: 'div' }
				]
			},
			{ string : 'section' }
		]
		expect(result).toEqual(correct);
	});
});
