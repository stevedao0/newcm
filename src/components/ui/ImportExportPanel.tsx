import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import Button from './Button';
import Card, { CardHeader, CardContent } from './Card';
import { ImportResult } from '../../types/contract';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface ImportExportPanelProps {
  onImportInfo: (data: any[]) => Promise<ImportResult>;
  onImportWorkList: (data: any[]) => Promise<ImportResult>;
  onExportData: () => void;
  className?: string;
}

const ImportExportPanel: React.FC<ImportExportPanelProps> = ({ 
  onImportInfo, 
  onImportWorkList, 
  onExportData,
  className = '' 
}) => {
  const [infoFile, setInfoFile] = useState<File | null>(null);
  const [workListFile, setWorkListFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  
  const infoFileInputRef = useRef<HTMLInputElement>(null);
  const workListFileInputRef = useRef<HTMLInputElement>(null);

  const handleInfoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setInfoFile(e.target.files[0]);
    }
  };

  const handleWorkListFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setWorkListFile(e.target.files[0]);
    }
  };

  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  };

  const parseExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          resolve(json);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  const handleImport = async () => {
    if (!infoFile && !workListFile) {
      setImportResult({
        success: false,
        message: 'Vui lòng chọn ít nhất một file để import'
      });
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      let infoData: any[] = [];
      let workListData: any[] = [];
      let result: ImportResult = {
        success: true,
        message: 'Import thành công',
        totalRecords: 0,
        newRecords: 0,
        updatedRecords: 0
      };

      // Parse Info.csv if provided
      if (infoFile) {
        if (infoFile.name.endsWith('.csv')) {
          infoData = await parseCSV(infoFile);
        } else if (infoFile.name.endsWith('.xlsx') || infoFile.name.endsWith('.xls')) {
          infoData = await parseExcel(infoFile);
        } else {
          throw new Error('File Info không đúng định dạng. Chỉ hỗ trợ CSV hoặc Excel.');
        }
        
        const infoResult = await onImportInfo(infoData);
        if (!infoResult.success) {
          throw new Error(infoResult.message);
        }
        
        result.totalRecords = (result.totalRecords || 0) + (infoResult.totalRecords || 0);
        result.newRecords = (result.newRecords || 0) + (infoResult.newRecords || 0);
        result.updatedRecords = (result.updatedRecords || 0) + (infoResult.updatedRecords || 0);
      }

      // Parse WorkList.csv if provided
      if (workListFile) {
        if (workListFile.name.endsWith('.csv')) {
          workListData = await parseCSV(workListFile);
        } else if (workListFile.name.endsWith('.xlsx') || workListFile.name.endsWith('.xls')) {
          workListData = await parseExcel(workListFile);
        } else {
          throw new Error('File WorkList không đúng định dạng. Chỉ hỗ trợ CSV hoặc Excel.');
        }
        
        const workListResult = await onImportWorkList(workListData);
        if (!workListResult.success) {
          throw new Error(workListResult.message);
        }
        
        result.totalRecords = (result.totalRecords || 0) + (workListResult.totalRecords || 0);
        result.newRecords = (result.newRecords || 0) + (workListResult.newRecords || 0);
        result.updatedRecords = (result.updatedRecords || 0) + (workListResult.updatedRecords || 0);
      }

      setImportResult(result);
      
      // Reset file inputs
      setInfoFile(null);
      setWorkListFile(null);
      if (infoFileInputRef.current) infoFileInputRef.current.value = '';
      if (workListFileInputRef.current) workListFileInputRef.current.value = '';
      
    } catch (error) {
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Lỗi không xác định khi import dữ liệu'
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <h3 className="text-lg font-semibold text-slate-900">Import / Export Dữ liệu</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-slate-800">Import dữ liệu</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    File Info.csv
                  </label>
                  <div className="flex items-center">
                    <input
                      type="file"
                      ref={infoFileInputRef}
                      onChange={handleInfoFileChange}
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      id="info-file-input"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => infoFileInputRef.current?.click()}
                      className="mr-3"
                    >
                      Chọn file
                    </Button>
                    <span className="text-sm text-slate-600 truncate max-w-[200px]">
                      {infoFile ? infoFile.name : 'Chưa chọn file'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Hỗ trợ định dạng CSV, Excel (.xlsx, .xls)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    File WorkList.csv
                  </label>
                  <div className="flex items-center">
                    <input
                      type="file"
                      ref={workListFileInputRef}
                      onChange={handleWorkListFileChange}
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      id="worklist-file-input"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => workListFileInputRef.current?.click()}
                      className="mr-3"
                    >
                      Chọn file
                    </Button>
                    <span className="text-sm text-slate-600 truncate max-w-[200px]">
                      {workListFile ? workListFile.name : 'Chưa chọn file'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Hỗ trợ định dạng CSV, Excel (.xlsx, .xls)
                  </p>
                </div>
                
                <Button 
                  variant="primary" 
                  icon={Upload}
                  onClick={handleImport}
                  disabled={importing || (!infoFile && !workListFile)}
                >
                  {importing ? 'Đang import...' : 'Import dữ liệu'}
                </Button>
              </div>
              
              {importResult && (
                <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  <div className="flex items-start">
                    {importResult.success ? (
                      <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">{importResult.message}</p>
                      {importResult.success && (
                        <ul className="mt-1 text-sm">
                          <li>Tổng số bản ghi: {importResult.totalRecords}</li>
                          <li>Bản ghi mới: {importResult.newRecords}</li>
                          <li>Bản ghi cập nhật: {importResult.updatedRecords}</li>
                        </ul>
                      )}
                      {importResult.errors && importResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium">Lỗi:</p>
                          <ul className="list-disc pl-5 text-sm">
                            {importResult.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-slate-800">Export dữ liệu</h4>
              
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Xuất toàn bộ dữ liệu hệ thống ra file để lưu trữ hoặc xử lý ngoài hệ thống.
                </p>
                
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    icon={FileText}
                    onClick={onExportData}
                    className="w-full sm:w-auto"
                  >
                    Xuất CSV
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    icon={Download}
                    onClick={onExportData}
                    className="w-full sm:w-auto"
                  >
                    Xuất Excel
                  </Button>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex">
                    <FileText className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">Lưu ý khi export dữ liệu</p>
                      <p className="mt-1">
                        Dữ liệu xuất ra sẽ bao gồm tất cả thông tin về hợp đồng, tác phẩm, đối tác và kênh phân phối.
                        Đảm bảo bạn có quyền truy cập đầy đủ trước khi thực hiện thao tác này.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportExportPanel;