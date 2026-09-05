/**
 * Extract plain text from a document buffer based on its MIME type.
 * Supports PDF and DOCX (Word). Returns null for unsupported types.
 */
export async function extractTextFromDocument(
	buffer: Uint8Array,
	mimeType: string
): Promise<string | null> {
	if (mimeType === 'application/pdf') {
		return extractPdfText(buffer);
	}
	if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
		return extractDocxText(buffer);
	}
	if (mimeType === 'text/plain') {
		return Buffer.from(buffer).toString('utf8');
	}
	return null;
}

async function extractPdfText(buffer: Uint8Array): Promise<string | null> {
	const { PDFParse } = await import('pdf-parse');
	try {
		const parser = new PDFParse({ data: new Uint8Array(buffer) });
		try {
			const result = await parser.getText();
			return typeof result.text === 'string' ? result.text : null;
		} finally {
			await parser.destroy();
		}
	} catch {
		return null;
	}
}

async function extractDocxText(buffer: Uint8Array): Promise<string | null> {
	const mammoth = await import('mammoth');
	try {
		const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
		return typeof result.value === 'string' ? result.value : null;
	} catch {
		return null;
	}
}
