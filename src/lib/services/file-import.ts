import { loadVT2File } from './vt-converter';
import type { Project } from '../models/project';

export class FileImportService {
	static async importVT2(): Promise<Project | null> {
		try {
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = '.vt2';
			input.style.display = 'none';

			document.body.appendChild(input);

			return new Promise((resolve, reject) => {
				input.onchange = async (event) => {
					const target = event.target as HTMLInputElement;
					const file = target.files?.[0];

					document.body.removeChild(input);

					if (!file) {
						resolve(null);
						return;
					}

					try {
						const project = await loadVT2File(file);
						resolve(project);
					} catch (error) {
						console.error('Error loading VT2 file:', error);
						reject(error);
					}
				};

				input.oncancel = () => {
					document.body.removeChild(input);
					resolve(null);
				};

				input.click();
			});
		} catch (error) {
			console.error('Error importing VT2 file:', error);
			throw error;
		}
	}

	static async handleMenuAction(action: string): Promise<Project | null> {
		switch (action) {
			case 'import-vt2':
				return await this.importVT2();
			default:
				console.warn('Unknown import action:', action);
				return null;
		}
	}
}

export async function handleFileImport(action: string): Promise<Project | null> {
	return FileImportService.handleMenuAction(action);
}
