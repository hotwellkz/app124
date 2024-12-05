import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { collection, query, where, getDocs, orderBy, limit, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';

const DOCUMENT_NUMBER_KEY = 'current_document_number';

export const getNextDocumentNumber = async (type: 'income' | 'expense'): Promise<string> => {
  try {
    const savedNumber = localStorage.getItem(`${DOCUMENT_NUMBER_KEY}_${type}`);
    if (savedNumber) {
      return savedNumber;
    }

    return await runTransaction(db, async (transaction) => {
      // Получаем последний документ данного типа
      const q = query(
        collection(db, 'warehouseDocuments'),
        where('type', '==', type),
        orderBy('documentNumber', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      let nextNumber = 1;

      if (!snapshot.empty) {
        const lastDoc = snapshot.docs[0];
        const lastNumber = parseInt(lastDoc.data().documentNumber);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    
      const formattedNumber = String(nextNumber).padStart(6, '0');
      localStorage.setItem(`${DOCUMENT_NUMBER_KEY}_${type}`, formattedNumber);
    
      return formattedNumber;
    });
    
  } catch (error) {
    console.error('Error generating document number:', error);
    throw error;
  }
};

export const clearSavedDocumentNumber = (type: 'income' | 'expense') => {
  localStorage.removeItem(`${DOCUMENT_NUMBER_KEY}_${type}`);
};

// Функция для генерации PDF из HTML элемента
export const generatePDFFromElement = async (elementId: string, fileName: string = 'document.pdf') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) throw new Error('Element not found');

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let firstPage = true;

    while (heightLeft >= 0) {
      if (!firstPage) {
        pdf.addPage();
      }
      
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 1.0),
        'JPEG',
        0,
        position,
        imgWidth,
        imgHeight
      );
      
      heightLeft -= pageHeight;
      position -= pageHeight;
      firstPage = false;
    }

    pdf.save(fileName);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

// Функция для генерации DOCX из данных контракта
export const generateDOCX = async (contractData: any, fileName: string = 'document.docx') => {
  try {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Договор подряда №${contractData.contractNumber}`,
                bold: true,
                size: 28
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: {
              after: 200
            },
            children: [
              new TextRun({
                text: `г. Алматы                                                                                           ${new Date().toLocaleDateString('ru-RU')}`,
                size: 24
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: {
              after: 200
            },
            children: [
              new TextRun({
                text: 'ТОО "HotWell.KZ", БИН 180440039034, в лице Директора Милюк Виталия Игоревича, действующего на основании Устава, именуемый в дальнейшем «Исполнитель», с одной стороны и ',
                size: 24
              }),
              new TextRun({
                text: `${contractData.lastName} ${contractData.firstName} ${contractData.middleName}`,
                bold: true,
                size: 24
              }),
              new TextRun({
                text: `, ИИН ${contractData.iin}, именуемый(-ая) в дальнейшем «Заказчик», с другой стороны, далее совместно именуемые «Стороны», заключили настоящий Договор о нижеследующем:`,
                size: 24
              })
            ]
          }),
          // ... добавьте остальные параграфы договора
        ]
      }]
    });

    const buffer = await Packer.toBlob(doc);
    saveAs(buffer, fileName);
    return true;
  } catch (error) {
    console.error('Error generating DOCX:', error);
    return false;
  }
};

// Функция для форматирования суммы
export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('ru-RU').format(amount) + ' тг';
};