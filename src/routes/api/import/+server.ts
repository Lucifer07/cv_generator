import { error, json, type RequestHandler } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { ResumeRepository } from '$lib/server/repositories/resume.repository';
import { extractTextFromDocument } from '$lib/server/import/extract';
import { textToResumeData } from '$lib/server/import/parse';

const MAX_FILE_BYTES = 8 * 1024 * 1024;

const SUPPORTED_MIME = new Set([
	'application/pdf',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'text/plain'
]);

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.session) throw error(401, 'Not authenticated');

	const contentType = request.headers.get('content-type') ?? '';
	if (!contentType.startsWith('multipart/form-data')) {
		return json({ error: 'Expected multipart/form-data' }, { status: 400 });
	}

	const form = await request.formData();
	const file = form.get('file');
	const title = String(form.get('title') ?? '').trim() || 'Imported resume';

	if (!(file instanceof File)) {
		return json({ error: 'No file provided' }, { status: 400 });
	}
	if (file.size > MAX_FILE_BYTES) {
		return json({ error: 'File exceeds the 8 MB limit' }, { status: 413 });
	}
	if (!SUPPORTED_MIME.has(file.type)) {
		return json(
			{
				error: 'Unsupported file type. Please upload a PDF, DOCX, or TXT document.'
			},
			{ status: 415 }
		);
	}

	const buffer = new Uint8Array(await file.arrayBuffer());
	const text = await extractTextFromDocument(buffer, file.type);
	if (!text || text.trim().length < 5) {
		return json(
			{ error: 'Could not extract text from the document. It may be scanned.' },
			{ status: 422 }
		);
	}

	const content = textToResumeData(text);
	const repo = new ResumeRepository(getDb());
	const resume = await repo.create(locals.session.userId, title, content);

	return json({ ok: true, id: resume.id });
};
