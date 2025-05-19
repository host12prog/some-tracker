export type MenuItem = {
	label: string;
	type?: 'normal' | 'expandable';
	icon?: string;
	items?: MenuItem[];
};
