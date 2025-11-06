/**
 * Export utilities for CSV, PNG, and PDF exports
 */

import { unparse as json2csv } from 'papaparse'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * Export data to CSV file
 */
export async function exportToCSV(data: any[], filename: string): Promise<void> {
  try {
    // Convert JSON to CSV
    const csv = json2csv(data, {
      quotes: true,
      delimiter: ',',
      header: true,
    })

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, filename)
  } catch (error) {
    console.error('Failed to export CSV:', error)
    throw new Error('Failed to export CSV')
  }
}

/**
 * Export HTML element to PNG image
 */
export async function exportToPNG(
  element: HTMLElement,
  filename: string,
  options?: {
    backgroundColor?: string
    scale?: number
    quality?: number
  }
): Promise<void> {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: options?.backgroundColor || '#ffffff',
      scale: options?.scale || 2,
      logging: false,
      useCORS: true,
      allowTaint: false,
    })

    // Convert canvas to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          downloadBlob(blob, filename)
        } else {
          throw new Error('Failed to create image blob')
        }
      },
      'image/png',
      options?.quality || 0.95
    )
  } catch (error) {
    console.error('Failed to export PNG:', error)
    throw new Error('Failed to export PNG')
  }
}

/**
 * Export multiple HTML elements to a single PDF
 */
export async function exportToPDF(
  elements: { element: HTMLElement; title?: string }[],
  filename: string,
  options?: {
    orientation?: 'portrait' | 'landscape'
    unit?: 'pt' | 'px' | 'in' | 'mm' | 'cm' | 'ex' | 'em' | 'pc'
    format?: string | number[]
  }
): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: options?.orientation || 'portrait',
      unit: options?.unit || 'mm',
      format: options?.format || 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10

    let isFirstPage = true

    for (const { element, title } of elements) {
      // Add new page if not first
      if (!isFirstPage) {
        pdf.addPage()
      }

      let yOffset = margin

      // Add title if provided
      if (title) {
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text(title, margin, yOffset + 5)
        yOffset += 12
      }

      // Convert element to canvas
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
      })

      // Calculate dimensions to fit page
      const imgWidth = pageWidth - 2 * margin
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Check if image fits on current page
      if (yOffset + imgHeight > pageHeight - margin) {
        // Image too tall, scale it down
        const maxHeight = pageHeight - yOffset - margin
        const scaledWidth = (canvas.width * maxHeight) / canvas.height
        const scaledHeight = maxHeight

        const imgData = canvas.toDataURL('image/png')
        pdf.addImage(imgData, 'PNG', margin, yOffset, scaledWidth, scaledHeight)
      } else {
        const imgData = canvas.toDataURL('image/png')
        pdf.addImage(imgData, 'PNG', margin, yOffset, imgWidth, imgHeight)
      }

      isFirstPage = false
    }

    // Save PDF
    pdf.save(filename)
  } catch (error) {
    console.error('Failed to export PDF:', error)
    throw new Error('Failed to export PDF')
  }
}

/**
 * Export single HTML element to PDF
 */
export async function exportElementToPDF(
  element: HTMLElement,
  filename: string,
  title?: string,
  options?: {
    orientation?: 'portrait' | 'landscape'
    unit?: 'pt' | 'px' | 'in' | 'mm' | 'cm' | 'ex' | 'em' | 'pc'
    format?: string | number[]
  }
): Promise<void> {
  return exportToPDF([{ element, title }], filename, options)
}

/**
 * Helper function to download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  return `${prefix}_${timestamp}.${extension}`
}
