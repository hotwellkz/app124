import React, { useState, useEffect } from 'react';
import { ArrowLeft, Barcode, QrCode, Plus, Minus, Image as ImageIcon, Trash2, History } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, collection, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Product } from '../../../types/product';
import { BarcodeGenerator } from '../../../components/warehouse/BarcodeGenerator';
import { ProductHistory } from '../../../components/warehouse/ProductHistory';
import { PasswordPrompt } from '../../../components/PasswordPrompt';
import { showSuccessNotification, showErrorNotification } from '../../../utils/notifications';

export const ProductDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [activeCode, setActiveCode] = useState<'barcode' | 'qrcode'>('qrcode');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuantity, setEditedQuantity] = useState<number>(0);
  const [editedPrice, setEditedPrice] = useState<number>(0);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      
      try {
        const productDoc = await getDoc(doc(db, 'products', id));
        if (productDoc.exists()) {
          const productData = { id: productDoc.id, ...productDoc.data() } as Product;
          setProduct(productData);
          setEditedQuantity(productData.quantity || 0);
          setEditedPrice(productData.averagePurchasePrice || 0);
        }
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleEditClick = () => {
    setShowPasswordPrompt(true);
  };

  const handlePasswordSuccess = () => {
    setShowPasswordPrompt(false);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!product) return;
    
    if (editedQuantity < 0) {
      showErrorNotification('Количество товара не может быть отрицательным');
      return;
    }

    if (editedPrice < 0) {
      showErrorNotification('Цена товара не может быть отрицательной');
      return;
    }

    try {
      const productRef = doc(db, 'products', product.id);
      const previousQuantity = product.quantity;
      const previousPrice = product.averagePurchasePrice;
      
      await updateDoc(productRef, {
        quantity: editedQuantity,
        averagePurchasePrice: editedPrice,
        totalPurchasePrice: editedQuantity * editedPrice,
        updatedAt: serverTimestamp()
      });
      
      // Обновляем состояние продукта локально
      setProduct({
        ...product,
        quantity: editedQuantity,
        averagePurchasePrice: editedPrice,
        totalPurchasePrice: editedQuantity * editedPrice
      });

      // Создаем запись в истории движения
      const movementRef = doc(collection(db, 'productMovements'));
      const isIncrease = editedQuantity > previousQuantity;
      
      await setDoc(movementRef, {
        productId: product.id,
        type: isIncrease ? 'in' : 'out',
        quantity: Math.abs(editedQuantity - previousQuantity),
        price: editedPrice,
        totalPrice: Math.abs(editedQuantity - previousQuantity) * editedPrice,
        date: serverTimestamp(),
        description: 'Ручная корректировка количества',
        warehouse: 'Основной склад',
        previousQuantity: previousQuantity,
        newQuantity: editedQuantity,
        previousAveragePrice: previousPrice,
        newAveragePrice: editedPrice
      });

      setIsEditing(false);
      showSuccessNotification('Количество товара успешно обновлено');
    } catch (error) {
      console.error('Error updating product:', error);
      showErrorNotification('Ошибка при обновлении количества товара');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Товар не найден</h2>
          <button
            onClick={() => navigate('/warehouse/products')}
            className="mt-4 text-emerald-600 hover:text-emerald-700"
          >
            Вернуться к списку товаров
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="text-gray-600">
                <ArrowLeft className="w-6 h-6"/>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Редактирование товара</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-7xl mx-auto p-4 space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Информация о товаре */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                {product?.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg shadow-sm"
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{product?.name}</h2>
                  <p className="text-base text-gray-600 mt-1">{product?.category}</p>
                </div>
                <div className="mt-2">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600">Количество:</span>
                      {isEditing ? (
                        <span className="ml-2">
                          <input
                            type="number"
                            value={isFocused && editedQuantity === 0 ? '' : editedQuantity}
                            onChange={(e) => setEditedQuantity(Number(e.target.value || 0))}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            className="w-24 px-2 py-1 border rounded focus:ring-2 focus:ring-emerald-500"
                          />
                          <span className="ml-2">{product.unit}</span>
                        </span>
                      ) : (
                        <span className="font-medium ml-2">{product.quantity} {product.unit}</span>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600">Средняя цена:</span>
                      {isEditing ? (
                        <span className="ml-2">
                          <input
                            type="number"
                            value={isFocused && editedPrice === 0 ? '' : editedPrice}
                            onChange={(e) => setEditedPrice(Number(e.target.value || 0))}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            className="w-24 px-2 py-1 border rounded focus:ring-2 focus:ring-emerald-500"
                          />
                          <span className="ml-2">₸</span>
                        </span>
                      ) : (
                        <span className="font-medium ml-2">{product.averagePurchasePrice?.toLocaleString()} ₸</span>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600">Общая стоимость:</span>
                      <span className="font-medium ml-2">
                        {(product.quantity * (product.averagePurchasePrice || 0)).toLocaleString()} ₸
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    {isEditing ? (
                      <div className="space-x-2">
                        <button
                          onClick={handleSave}
                          className="px-3 py-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                        >
                          Сохранить
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleEditClick}
                        className="px-3 py-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                      >
                        Редактировать
                      </button>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.quantity > (product.minQuantity || 0) ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.quantity > (product.minQuantity || 0) ? 'В наличии' : 'Мало на складе'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Коды */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveCode('barcode')}
                  className={`px-3 py-1.5 rounded ${
                    activeCode === 'barcode' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <Barcode className="w-4 h-4 inline-block mr-1" />
                  Штрих-код
                </button>
                <button
                  onClick={() => setActiveCode('qrcode')}
                  className={`px-3 py-1.5 rounded ${
                    activeCode === 'qrcode' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <QrCode className="w-4 h-4 inline-block mr-1" />
                  QR-код
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
              <BarcodeGenerator
                value={product?.id || ''}
                type={activeCode}
              />
            </div>
          </div>

          {/* История операций */}
          <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-lg font-medium">История операций</h3>
            <button
              onClick={() => setShowHistory(true)}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <History className="w-4 h-4" />
              Показать историю
            </button>
          </div>
        </div>

      {showHistory && product && (
        <ProductHistory
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          product={product}
        />
      )}

      {showPasswordPrompt && (
        <PasswordPrompt
          isOpen={showPasswordPrompt}
          onClose={() => setShowPasswordPrompt(false)}
          onSuccess={handlePasswordSuccess}
        />
      )}
    </div>
  );
};