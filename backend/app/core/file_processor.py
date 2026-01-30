import os
import PyPDF2
import docx
import logging

logger = logging.getLogger(__name__)

def extract_text_from_file(file_path: str) -> str:
    """Extract text from PDF, DOCX, or TXT file."""
    extension = os.path.splitext(file_path)[1].lower()
    
    if extension == ".pdf":
        text = extract_text_from_pdf(file_path)
    elif extension == ".docx":
        text = extract_text_from_docx(file_path)
    elif extension == ".txt":
        text = extract_text_from_txt(file_path)
    else:
        raise ValueError(f"Unsupported file extension: {extension}")
    
    logger.info(f"Extracted {len(text)} characters from {file_path}")
    return text

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with open(file_path, "rb") as file:
        try:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                try:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted.strip() + "\n"
                except Exception as e:
                    logger.warning(f"Failed to extract text from a page in {file_path}: {e}")
                    continue
        except Exception as e:
            logger.error(f"Failed to read PDF {file_path}: {e}")
            raise ValueError(f"Could not read PDF file: {str(e)}")
    return text.strip()

def extract_text_from_docx(file_path: str) -> str:
    doc = docx.Document(file_path)
    return "\n".join([paragraph.text for paragraph in doc.paragraphs])

def extract_text_from_txt(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8") as file:
        return file.read()
