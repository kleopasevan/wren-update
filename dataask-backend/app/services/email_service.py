"""Email service for sending query results."""
import io
import logging
from typing import Any
import csv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
import smtplib

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from app.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails with query results."""

    def __init__(self):
        """Initialize email service."""
        self.smtp_host = getattr(settings, "SMTP_HOST", "localhost")
        self.smtp_port = getattr(settings, "SMTP_PORT", 587)
        self.smtp_user = getattr(settings, "SMTP_USER", "")
        self.smtp_password = getattr(settings, "SMTP_PASSWORD", "")
        self.smtp_from = getattr(settings, "SMTP_FROM", "noreply@dataask.io")
        self.smtp_use_tls = getattr(settings, "SMTP_USE_TLS", True)

    def generate_csv(self, data: list[dict], columns: list[str] | None = None) -> bytes:
        """
        Generate CSV file from query results.

        Args:
            data: List of dictionaries with query results
            columns: Optional list of column names (uses keys from first row if None)

        Returns:
            CSV file as bytes
        """
        if not data:
            return b""

        output = io.StringIO()

        # Get columns from first row if not provided
        if columns is None:
            columns = list(data[0].keys())

        writer = csv.DictWriter(output, fieldnames=columns)
        writer.writeheader()
        writer.writerows(data)

        return output.getvalue().encode('utf-8')

    def generate_pdf(
        self,
        data: list[dict],
        title: str = "Query Results",
        columns: list[str] | None = None
    ) -> bytes:
        """
        Generate PDF file from query results.

        Args:
            data: List of dictionaries with query results
            title: Title for the PDF
            columns: Optional list of column names

        Returns:
            PDF file as bytes
        """
        if not data:
            # Create empty PDF
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter)
            elements = [Paragraph("No data available", getSampleStyleSheet()['Normal'])]
            doc.build(elements)
            return buffer.getvalue()

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)

        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#000000'),
            spaceAfter=12,
            alignment=TA_CENTER
        )

        # Elements
        elements = []

        # Add title
        elements.append(Paragraph(title, title_style))
        elements.append(Spacer(1, 0.2*inch))

        # Get columns
        if columns is None:
            columns = list(data[0].keys())

        # Prepare table data
        table_data = [columns]  # Header row
        for row in data:
            table_data.append([str(row.get(col, '')) for col in columns])

        # Create table
        table = Table(table_data, repeatRows=1)

        # Table style
        table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            # Body
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))

        elements.append(table)

        # Build PDF
        doc.build(elements)

        return buffer.getvalue()

    async def send_email(
        self,
        to: list[str],
        subject: str,
        body: str,
        attachments: list[dict[str, Any]] | None = None
    ) -> bool:
        """
        Send email with optional attachments.

        Args:
            to: List of recipient email addresses
            subject: Email subject
            body: Email body (HTML)
            attachments: List of dicts with 'filename' and 'data' (bytes)

        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.smtp_from
            msg['To'] = ', '.join(to)
            msg['Subject'] = subject

            # Add body
            msg.attach(MIMEText(body, 'html'))

            # Add attachments
            if attachments:
                for attachment in attachments:
                    part = MIMEApplication(attachment['data'], Name=attachment['filename'])
                    part['Content-Disposition'] = f'attachment; filename="{attachment["filename"]}"'
                    msg.attach(part)

            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if self.smtp_use_tls:
                    server.starttls()
                if self.smtp_user and self.smtp_password:
                    server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            logger.info(f"Email sent successfully to {to}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False


# Global email service instance
email_service = EmailService()
