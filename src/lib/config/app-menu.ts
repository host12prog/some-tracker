import type { MenuItem } from '../components/Menu/types';

export const menuItems: MenuItem[] = [
	{
		label: 'File',
		items: [
			{
				label: 'New',
				type: 'expandable',
				items: [
					{ label: 'Project', type: 'normal', icon: '📁' },
					{ label: 'File', type: 'normal', icon: '📁' },
					{ label: 'Folder', type: 'normal', icon: '📂' },
					{
						label: 'Special',
						type: 'expandable',
						items: [
							{ label: 'Web Project', type: 'normal' },
							{ label: 'Mobile App', type: 'normal' },
							{
								label: 'Advanced',
								type: 'expandable',
								items: [
									{ label: 'React App', type: 'normal' },
									{ label: 'Svelte App', type: 'normal' },
									{ label: 'Vue App', type: 'normal' }
								]
							}
						]
					}
				]
			},
			{ label: 'Open', type: 'normal' },
			{ label: 'Save', type: 'normal' },
			{ label: 'Save As', type: 'normal' },
			{ label: 'Exit', type: 'normal' }
		]
	},
	{
		label: 'Edit',
		items: [
			{ label: 'Undo', type: 'normal' },
			{ label: 'Redo', type: 'normal' },
			{
				label: 'Text',
				type: 'expandable',
				items: [
					{ label: 'Cut', type: 'normal' },
					{ label: 'Copy', type: 'normal' },
					{ label: 'Paste', type: 'normal' },
					{
						label: 'Transform',
						type: 'expandable',
						items: [
							{ label: 'Uppercase', type: 'normal' },
							{ label: 'Lowercase', type: 'normal' },
							{
								label: 'Convert',
								type: 'expandable',
								items: [
									{ label: 'To Camel Case', type: 'normal' },
									{ label: 'To Snake Case', type: 'normal' },
									{ label: 'To Pascal Case', type: 'normal' },
									{
										label: 'Advanced',
										type: 'expandable',
										items: [
											{ label: 'Remove Whitespace', type: 'normal' },
											{ label: 'Normalize', type: 'normal' }
										]
									}
								]
							}
						]
					}
				]
			}
		]
	},
	{
		label: 'View',
		items: [
			{
				label: 'Appearance',
				type: 'expandable',
				items: [
					{ label: 'Light Theme', type: 'normal' },
					{ label: 'Dark Theme', type: 'normal' },
					{
						label: 'Custom Themes',
						type: 'expandable',
						items: [
							{ label: 'Blue Theme', type: 'normal' },
							{ label: 'Green Theme', type: 'normal' },
							{
								label: 'Contrast',
								type: 'expandable',
								items: [
									{ label: 'High Contrast', type: 'normal' },
									{ label: 'Low Contrast', type: 'normal' }
								]
							}
						]
					},
					{ label: 'System Theme', type: 'normal' }
				]
			},
			{
				label: 'Zoom',
				type: 'expandable',
				items: [
					{ label: 'Zoom In', type: 'normal' },
					{ label: 'Zoom Out', type: 'normal' },
					{ label: 'Reset Zoom', type: 'normal' },
					{
						label: 'Presets',
						type: 'expandable',
						items: [
							{ label: '50%', type: 'normal' },
							{ label: '100%', type: 'normal' },
							{ label: '150%', type: 'normal' },
							{ label: '200%', type: 'normal' }
						]
					}
				]
			}
		]
	},
	{
		label: 'Help',
		items: [
			{ label: 'Documentation', type: 'normal' },
			{ label: 'About', type: 'normal' },
			{
				label: 'Support',
				type: 'expandable',
				items: [
					{ label: 'FAQ', type: 'normal' },
					{ label: 'Community Forum', type: 'normal' },
					{
						label: 'Contact',
						type: 'expandable',
						items: [
							{ label: 'Email Support', type: 'normal' },
							{ label: 'Live Chat', type: 'normal' },
							{ label: 'Phone Support', type: 'normal' }
						]
					}
				]
			}
		]
	}
];
