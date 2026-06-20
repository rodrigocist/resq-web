"use client";

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight } from 'lucide-react';

interface SwipeButtonProps {
  onSwipeComplete: () => Promise<void>;
}

export default function SwipeButton({ onSwipeComplete }: SwipeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const SWIPE_THRESHOLD = 0.85; // 85% para activar

  // Obtener ancho del contenedor
  React.useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const maxDrag = containerWidth ? containerWidth - 48 : 0; // 48px = thumb width

  const handleDragEnd = async (
    _event: unknown,
    info: { offset: { x: number } }
  ) => {
    const percentage = (info.offset.x / maxDrag) * 100;

    if (percentage >= SWIPE_THRESHOLD * 100) {
      // Dispara la acción
      setIsLoading(true);
      try {
        await onSwipeComplete();
        setIsSuccess(true);
        // Auto-reset después de 2 segundos
        setTimeout(() => {
          setIsSuccess(false);
          setIsLoading(false);
        }, 2000);
      } catch (err) {
        console.error('Error completing order:', err);
        setIsLoading(false);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-12 rounded-lg overflow-hidden bg-gray-200 hover:bg-gray-300 transition-colors ${
        isSuccess ? 'bg-green-100' : ''
      }`}
    >
      {/* Background track - animated */}
      <motion.div
        className={`absolute inset-0 ${
          isSuccess ? 'bg-green-500' : 'bg-green-400'
        }`}
        initial={{ width: '0%' }}
        animate={{
          width: isSuccess ? '100%' : '0%',
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />

      {/* Draggable thumb */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className={`absolute top-0 bottom-0 w-12 rounded-lg flex items-center justify-center transition-all ${
          isSuccess ? 'bg-green-500' : 'bg-white shadow-md'
        } ${isLoading || isSuccess ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
        style={{
          pointerEvents: isLoading || isSuccess ? 'none' : 'auto',
        }}
      >
        {isSuccess ? (
          <CheckCircle2 className="h-6 w-6 text-white" />
        ) : isLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-400 border-t-green-600"></div>
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-600" />
        )}
      </motion.div>

      {/* Texto - centered */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.span
          className="font-medium text-sm"
          animate={{
            color: isSuccess ? '#ffffff' : '#1f2937',
          }}
          transition={{ duration: 0.2 }}
        >
          {isSuccess
            ? '¡Entregado!'
            : isLoading
              ? 'Procesando...'
              : 'Deslizar para retirar'}
        </motion.span>
      </div>
    </div>
  );
}

