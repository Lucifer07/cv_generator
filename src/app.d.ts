declare global {
	namespace App {
		interface Locals {
			session: { userId: string; email: string } | null;
		}
		interface PageData {
			session?: { userId: string; email: string } | null;
		}
	}
}

export {};
