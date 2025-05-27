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
					{
						label: 'Song',
						type: 'expandable',
						icon: '📁',
						items: [
							{ label: 'AY/YM', type: 'normal' },
							{ label: 'FM', type: 'normal' }
						]
					}
				]
			},
			{ label: 'Open', type: 'normal' },
			{
				label: 'Import',
				type: 'expandable',
				items: [{ label: 'VT2 Module', type: 'normal', action: 'import-vt2' }]
			},
			{ label: 'Save', type: 'normal' },
			{ label: 'Save As', type: 'normal' },
			{ label: 'Exit', type: 'normal' }
		]
	},
	{
		label: 'Edit',
		items: [
			{ label: 'Undo', type: 'normal' },
			{ label: 'Redo', type: 'normal' }
		]
	},
	{
		label: 'View',
		items: [
			{
				label: 'Appearance',
				type: 'normal'
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
					{
						label: 'Contact',
						type: 'normal'
					}
				]
			}
		]
	}
];
