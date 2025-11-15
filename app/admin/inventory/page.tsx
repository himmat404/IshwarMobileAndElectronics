'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import type { Product } from '@/types';
import {
  Loader2,
  Search,
  ArrowUpDown,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_ITEMS_PER_PAGE = 50;

type ExportFormat = 'csv' | 'excel' | 'pdf';

export default function AdminInventoryPageCompact() {
  const { token } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const defaultColumns = {
    image: true,
    name: true,
    models: true,
    sku: true,
    material: true,
    color: true,
    price: true,
    stockQuantity: true,
    createdAt: false,
    updatedAt: false,
  };

  const [columns, setColumns] = useState<Record<string, boolean>>(defaultColumns);
  const [showColumnsModal, setShowColumnsModal] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const anySelected = Object.values(selectedIds).some(Boolean);

  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAction, setStockAction] = useState<'in' | 'out'>('in');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const rowPadding = 'py-2 px-3';
  const headerPadding = 'py-2 px-3';

  const fetchProducts = useCallback(async () => {
    setSearching(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', limit.toString());
      params.append('sortBy', sortBy);
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setProducts(data.products || []);
        setTotalCount(data.total || data.products.length || 0);
        setTotalPages(data.totalPages || Math.ceil((data.total || 0) / limit));
      }
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [currentPage, debouncedSearchQuery, sortBy, limit]);

  useEffect(() => {
    setLoading(true);
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchQuery(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage !== 1) setCurrentPage(1);
  }, [debouncedSearchQuery, sortBy, limit]);

  const toggleSelectAllOnPage = (checked: boolean) => {
    const newSel = { ...selectedIds };
    products.forEach((p) => {
      if (checked) newSel[p._id] = true;
      else delete newSel[p._id];
    });
    setSelectedIds(newSel);
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const np = { ...prev };
      if (np[id]) delete np[id];
      else np[id] = true;
      return np;
    });
  };

  const selectedProducts = useMemo(() => {
    return products.filter((p) => selectedIds[p._id]);
  }, [products, selectedIds]);

  function escapeCsvValue(val: any) {
    if (val === undefined || val === null) return '';
    const s = String(val);
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  async function fetchAllForExport() {
    try {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '10000');
      params.append('sortBy', sortBy);
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      return data.products || [];
    } catch {
      return [];
    }
  }

    async function handleExport(format: ExportFormat) {

    let rows: Product[] = [];

    // 1️⃣ If products are selected → export selected only
    if (anySelected) {
      rows = selectedProducts;
    } 
    
    // 2️⃣ Otherwise → export full filtered dataset
    else {
      rows = await fetchAllForExport();
    }

    if (!rows || rows.length === 0) {
      alert('No data available to export.');
      return;
    }

    if (format === 'csv') return exportCSV(rows);
    if (format === 'excel') return exportExcel(rows);
    return exportPDF(rows);
  }



  async function exportCSV(rows: Product[], filename = 'inventory.csv') {
    const headers: string[] = [];
    if (columns.image) headers.push('Image');
    if (columns.name) headers.push('Name');
    if (columns.models) headers.push('Models');
    if (columns.sku) headers.push('SKU');
    if (columns.material) headers.push('Material');
    if (columns.color) headers.push('Color');
    if (columns.price) headers.push('Price');
    if (columns.stockQuantity) headers.push('Stock');
    if (columns.createdAt) headers.push('Created At');
    if (columns.updatedAt) headers.push('Updated At');

    const lines = [headers.join(',')];

    for (const p of rows) {
      const modelNames = Array.isArray(p.models)
        ? p.models
            .map((m: any) =>
              m?.brandId?.name ? `${m.brandId.name} ${m.name}` : m?.name || ''
            )
            .filter(Boolean)
            .join('; ')
        : '';

      const cols: string[] = [];
      if (columns.image) cols.push(escapeCsvValue(p.images?.[0] || ''));
      if (columns.name) cols.push(escapeCsvValue(p.name));
      if (columns.models) cols.push(escapeCsvValue(modelNames));
      if (columns.sku) cols.push(escapeCsvValue(p.sku));
      if (columns.material) cols.push(escapeCsvValue(p.material || ''));
      if (columns.color) cols.push(escapeCsvValue(p.color || ''));
      if (columns.price) cols.push(escapeCsvValue(p.price));
      if (columns.stockQuantity) cols.push(escapeCsvValue(p.stockQuantity));
      if (columns.createdAt) cols.push(escapeCsvValue(p.createdAt));
      if (columns.updatedAt) cols.push(escapeCsvValue(p.updatedAt));

      lines.push(cols.join(','));
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  async function exportExcel(rows: Product[], filename = 'inventory.xlsx') {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Inventory');

      // Build header row dynamically
      const headerRow = [];
      if (columns.image) headerRow.push('Image');
      if (columns.name) headerRow.push('Name');
      if (columns.models) headerRow.push('Models');
      if (columns.sku) headerRow.push('SKU');
      if (columns.material) headerRow.push('Material');
      if (columns.color) headerRow.push('Color');
      if (columns.price) headerRow.push('Price');
      if (columns.stockQuantity) headerRow.push('Stock');
      if (columns.createdAt) headerRow.push('Created At');
      if (columns.updatedAt) headerRow.push('Updated At');

      sheet.addRow(headerRow);

      // Add all product rows
      for (const p of rows) {
        const modelNames = Array.isArray(p.models)
          ? p.models
              .map((m: any) =>
                m?.brandId?.name ? `${m.brandId.name} ${m.name}` : m?.name || ''
              )
              .filter(Boolean)
              .join('; ')
          : '';

        const row = [];
        if (columns.image) row.push(p.images?.[0] || '');
        if (columns.name) row.push(p.name);
        if (columns.models) row.push(modelNames);
        if (columns.sku) row.push(p.sku);
        if (columns.material) row.push(p.material || '');
        if (columns.color) row.push(p.color || '');
        if (columns.price) row.push(p.price); // raw number (no symbol)
        if (columns.stockQuantity) row.push(p.stockQuantity);
        if (columns.createdAt) row.push(p.createdAt);
        if (columns.updatedAt) row.push(p.updatedAt);

        sheet.addRow(row);
      }

      // Auto-size column widths
      sheet.columns.forEach((col) => {
        let maxLength = 10; // minimum width

        col?.eachCell?.({ includeEmpty: true }, (cell) => {
          const value = cell.value ? cell.value.toString() : "";
          maxLength = Math.max(maxLength, value.length + 2);
        });

        if (col) col.width = maxLength;
      });

      // Generate and download Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();

    } catch (e) {
      console.error("Excel export failed, falling back to CSV:", e);
      exportCSV(rows, filename.replace('.xlsx', '.csv'));
    }
  }



  async function exportPDF(rows: Product[], filename = 'inventory.pdf') {
    try {
      const doc = new jsPDF('landscape');
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Inventory Report', 14, 15);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        14,
        22
      );

      const head: string[] = [];
      const columnStyles: any = {};
      let colIndex = 0;

      if (columns.image) {
        head.push('Image');
        columnStyles[colIndex++] = { cellWidth: 20, halign: 'center' };
      }
      if (columns.name) {
        head.push('Name');
        columnStyles[colIndex++] = { cellWidth: 40 };
      }
      if (columns.models) {
        head.push('Models');
        columnStyles[colIndex++] = { cellWidth: 50 };
      }
      if (columns.sku) {
        head.push('SKU');
        columnStyles[colIndex++] = { cellWidth: 30 };
      }
      if (columns.material) {
        head.push('Material');
        columnStyles[colIndex++] = { cellWidth: 25 };
      }
      if (columns.color) {
        head.push('Color');
        columnStyles[colIndex++] = { cellWidth: 25 };
      }
      if (columns.price) {
        head.push('Price');
        columnStyles[colIndex++] = { cellWidth: 20, halign: 'right' };
      }
      if (columns.stockQuantity) {
        head.push('Stock');
        columnStyles[colIndex++] = { cellWidth: 15, halign: 'center' };
      }

      const loadedImages = await Promise.all(
        rows.map(async (p) => {
          if (columns.image && p.images?.[0]) {
            try {
              const response = await fetch(p.images[0]);
              const blob = await response.blob();
              return new Promise<string | null>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
              });
            } catch {
              return null;
            }
          }
          return null;
        })
      );

      const body = rows.map((p, index) => {
        const modelNames = Array.isArray(p.models)
          ? p.models
              .map((m: any) =>
                m?.brandId?.name ? `${m.brandId.name} ${m.name}` : m?.name || ''
              )
              .join(', ')
          : '';

        const row: any[] = [];

        if (columns.image) row.push('');
        if (columns.name) row.push(p.name);
        if (columns.models) row.push(modelNames);
        if (columns.sku) row.push(p.sku);
        if (columns.material) row.push(p.material || '-');
        if (columns.color) row.push(p.color || '-');
        if (columns.price) row.push(String(p.price));
        if (columns.stockQuantity) row.push(String(p.stockQuantity));

        return row;
      });

      autoTable(doc, {
        startY: 28,
        head: [head],
        body: body,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
          cellPadding: 3,
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2,
          textColor: 50,
          minCellHeight: 18,
        },
        columnStyles: columnStyles,
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        didDrawCell: (data: any) => {
          if (columns.image && data.column.index === 0 && data.section === 'body') {
            const rowIndex = data.row.index;
            const imageData = loadedImages[rowIndex];

            if (imageData && typeof imageData === 'string' && imageData.startsWith('data:image')) {
              try {
                const imgWidth = 16;
                const imgHeight = 16;
                const xPos = data.cell.x + (data.cell.width - imgWidth) / 2;
                const yPos = data.cell.y + (data.cell.height - imgHeight) / 2;

                doc.addImage(imageData, 'JPEG', xPos, yPos, imgWidth, imgHeight);
              } catch {}
            }
          }
        },
        margin: { top: 28, right: 10, bottom: 10, left: 10 },
      });

      doc.save(filename);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF export failed — see console for details.");
    }
  }

  const openStockModal = (product: Product, action: 'in' | 'out') => {
    setSelectedProduct(product);
    setStockAction(action);
    setShowStockModal(true);
  };

  const handleModalClose = (updated?: boolean) => {
    setShowStockModal(false);
    setSelectedProduct(null);
    if (updated) fetchProducts();
  };

  const bulkStockAction = async (action: 'in' | 'out') => {
    if (!anySelected) return alert('Select at least one product.');

    const qStr = prompt(`Enter quantity to ${action === 'in' ? 'add' : 'remove'}:`);
    if (!qStr) return;
    const q = parseInt(qStr);
    if (isNaN(q) || q < 1) return alert('Invalid quantity.');

    setLoading(true);
    try {
      for (const p of selectedProducts) {
        if (action === 'out' && p.stockQuantity < q) continue;

        const endpoint = action === 'in' ? '/api/inventory/stock-in' : '/api/inventory/stock-out';

        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productId: p._id, quantity: q }),
        });
      }

      await fetchProducts();
      setSelectedIds({});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card animate-fade-in p-3">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h1 className="text-lg font-bold">Inventory</h1>
          <p className="text-xs text-[var(--muted)]">
            Manage stock for {totalCount} products — compact view
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowColumnsModal(true)}
            className="px-2 py-1 text-xs rounded-lg border border-[var(--border)]"
          >
            Select Columns
          </button>

          <button
            onClick={() => handleExport('csv')}
            className="px-2 py-1 text-xs rounded-lg border inline-flex gap-1"
          >
            <FileText className="w-4 h-4" /> CSV
          </button>

          <button
            onClick={() => handleExport('excel')}
            className="px-2 py-1 text-xs rounded-lg border inline-flex gap-1"
          >
            <FileSpreadsheet className="w-4 h-4" /> XLSX
          </button>

          <button
            onClick={() => handleExport('pdf')}
            className="px-2 py-1 text-xs rounded-lg border inline-flex gap-1"
          >
            <Download className="w-4 h-4" /> PDF
          </button>

          <button
            onClick={() => bulkStockAction('in')}
            disabled={!anySelected}
            className="px-2 py-1 text-xs rounded-lg bg-green-50 text-green-800"
          >
            + In
          </button>

          <button
            onClick={() => bulkStockAction('out')}
            disabled={!anySelected}
            className="px-2 py-1 text-xs rounded-lg bg-red-50 text-red-800"
          >
            - Out
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input
            className="w-full pl-9 pr-10 py-2 text-sm border rounded-lg"
            placeholder="Search products, SKU or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searching && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />}
          {!searching && searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-[var(--muted)]" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <ArrowUpDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border rounded-lg"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="date-newest">Newest</option>
              <option value="date-oldest">Oldest</option>
              <option value="price-low">Price (Low)</option>
              <option value="price-high">Price (High)</option>
            </select>
          </div>

          <select
            className="py-2 text-sm border rounded-lg"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
          >
            {ITEMS_PER_PAGE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o} / page
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-gray-50 sticky top-0 z-20">
            <tr>
              <th className={headerPadding}>
                <input
                  type="checkbox"
                  checked={products.length > 0 && products.every((p) => selectedIds[p._id])}
                  onChange={(e) => toggleSelectAllOnPage(e.target.checked)}
                />
              </th>

              {columns.image && <th className={headerPadding}>Image</th>}
              {columns.name && <th className={headerPadding}>Product</th>}
              {columns.models && <th className={headerPadding}>Models</th>}
              {columns.sku && <th className={headerPadding}>SKU</th>}
              {columns.material && <th className={headerPadding}>Material</th>}
              {columns.color && <th className={headerPadding}>Color</th>}
              {columns.price && <th className={headerPadding}>Price</th>}
              {columns.stockQuantity && <th className={headerPadding}>Stock</th>}

              <th className={headerPadding}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => {
              const modelString =
                product.models
                  ?.map((m: any) =>
                    m?.brandId?.name ? `${m.brandId.name} ${m.name}` : m?.name
                  )
                  .filter(Boolean)
                  .join(', ') || '';

              const isSelected = !!selectedIds[product._id];

              return (
                <tr
                  key={product._id}
                  className={`${rowPadding} hover:bg-gray-50 ${
                    product.stockQuantity === 0
                      ? 'bg-red-50'
                      : product.stockQuantity < 5
                      ? 'bg-yellow-50'
                      : ''
                  }`}
                >
                  <td className="px-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(product._id)}
                    />
                  </td>

                  {columns.image && (
                    <td className="px-3">
                      {product.images?.[0] ? (
                        <div className="w-10 h-10 relative rounded overflow-hidden bg-white">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-400 rounded">
                          N/A
                        </div>
                      )}
                    </td>
                  )}

                  {columns.name && (
                    <td className="px-3 align-top">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-[var(--muted)] line-clamp-1">
                        {modelString}
                      </div>
                    </td>
                  )}

                  {columns.models && (
                    <td className="px-3 text-xs text-[var(--muted)]">
                      {modelString || '—'}
                    </td>
                  )}

                  {columns.sku && (
                    <td className="px-3 text-xs text-[var(--muted)]">{product.sku}</td>
                  )}

                  {columns.material && (
                    <td className="px-3 text-xs">{product.material || '—'}</td>
                  )}

                  {columns.color && (
                    <td className="px-3 text-xs">{product.color || '—'}</td>
                  )}

                  {columns.price && (
                    <td className="px-3 font-medium">{product.price}</td>
                  )}

                  {columns.stockQuantity && (
                    <td className="px-3 font-bold">{product.stockQuantity}</td>
                  )}

                  <td className="px-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openStockModal(product, 'in')}
                        className="px-2 py-1 text-xs rounded border"
                      >
                        Stock In
                      </button>

                      <button
                        onClick={() => openStockModal(product, 'out')}
                        disabled={product.stockQuantity === 0}
                        className="px-2 py-1 text-xs rounded border disabled:opacity-50"
                      >
                        Stock Out
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs">
        <div>
          Showing {(currentPage - 1) * limit + 1} -{' '}
          {Math.min(currentPage * limit, totalCount)} of {totalCount}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 rounded border disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div>
            Page {currentPage} / {totalPages}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 rounded border disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showColumnsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 max-w-md w-full">
            <h3 className="font-semibold mb-2">Select Columns</h3>

            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              {Object.keys(defaultColumns).map((key) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!columns[key]}
                    onChange={(e) =>
                      setColumns((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                  />
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowColumnsModal(false)}
                className="px-3 py-1 border rounded"
              >
                Close
              </button>

              <button
                onClick={() => setShowColumnsModal(false)}
                className="px-3 py-1 bg-[var(--accent)] text-white rounded flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showStockModal && selectedProduct && (
        <StockModal
          key={selectedProduct._id + stockAction}
          product={selectedProduct}
          action={stockAction}
          onClose={handleModalClose}
          token={token!}
        />
      )}
    </div>
  );
}

function StockModal({
  product,
  action,
  onClose,
  token,
}: {
  product: Product;
  action: 'in' | 'out';
  onClose: (updated?: boolean) => void;
  token: string;
}) {
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const maxQuantity = action === 'out' ? product.stockQuantity : 99999;
  const isError = quantity < 1 || quantity > maxQuantity;

  const newStock =
    action === 'in'
      ? product.stockQuantity + quantity
      : product.stockQuantity - quantity;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setError('');

    try {
      const endpoint =
        action === 'in'
          ? '/api/inventory/stock-in'
          : '/api/inventory/stock-out';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product._id, quantity }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Operation failed');
      } else {
        onClose(true);
      }
    } catch {
      setError('Server error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-4 max-w-md w-full">
        <h3 className="font-semibold mb-2">
          {action === 'in' ? 'Stock In' : 'Stock Out'}
        </h3>

        <div className="bg-gray-50 p-3 rounded mb-3 text-sm">
          <div className="font-medium">{product.name}</div>
          <div className="text-xs text-[var(--muted)]">SKU: {product.sku}</div>
          <div className="text-xs mt-1">
            Current stock: <span className="font-bold">{product.stockQuantity}</span>
          </div>
        </div>

        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div>
            <label className="block text-xs mb-1">Quantity</label>

            <input
              type="number"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value || '0') || 0)}
              className={`w-full px-3 py-2 border rounded ${
                isError ? 'border-red-500' : ''
              }`}
            />

            {!isError ? (
              <div className="text-xs text-[var(--muted)] mt-1">
                New stock will be <span className="font-bold">{newStock}</span>
              </div>
            ) : (
              <div className="text-xs text-red-600 mt-1">
                {action === 'out'
                  ? `Cannot remove more than ${maxQuantity}`
                  : 'Quantity must be at least 1'}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onClose()}
              className="px-3 py-1 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || isError}
              className="px-3 py-1 bg-[var(--accent)] text-white rounded"
            >
              {saving
                ? 'Processing...'
                : action === 'in'
                ? 'Add Stock'
                : 'Remove Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
