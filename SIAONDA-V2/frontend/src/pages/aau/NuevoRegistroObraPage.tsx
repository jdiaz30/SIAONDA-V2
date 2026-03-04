import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BusquedaAutoresStep from '../../components/aau/BusquedaAutoresStep';
import SelectorProductoStep from '../../components/aau/SelectorProductoStep';
import FormularioObraStepDinamico from '../../components/aau/FormularioObraStepDinamico';
import CarritoObrasStep from '../../components/aau/CarritoObrasStep';
import RevisionStep from '../../components/aau/RevisionStep';
import DatosProduccionStep from '../../components/aau/DatosProduccionStep';
import { formulariosService } from '../../services/formulariosService';
import produccionesService from '../../services/produccionesService';
import { getErrorMessage } from '../../utils/errorHandler';
import { usePermissions } from '../../hooks/usePermissions';
import NoAccess from '../../components/common/NoAccess';

interface AutorSeleccionado {
  id: number;
  cliente: any;
  rol: string;
  orden: number;
}

interface ProductoSeleccionado {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
}

interface ObraEnCarrito {
  id: string; // UUID temporal
  producto: ProductoSeleccionado;
  datosFormulario: any;
}

type Step = 'autores' | 'carrito' | 'producto' | 'formulario' | 'revision' | 'produccion-datos';

const NuevoRegistroObraPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // Verificar permiso para crear formularios
  if (!hasPermission('atu.formularios.create')) {
    return (
      <div className="p-8">
        <NoAccess message="No tienes permiso para crear nuevos registros de obras. Esta funcionalidad es solo para Técnicos ATU y Encargado de ATU." />
      </div>
    );
  }

  const [currentStep, setCurrentStep] = useState<Step>('autores');
  const [autoresSeleccionados, setAutoresSeleccionados] = useState<AutorSeleccionado[]>([]);
  const [obrasEnCarrito, setObrasEnCarrito] = useState<ObraEnCarrito[]>([]);

  // Estados temporales para agregar/editar obra
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoSeleccionado | null>(null);
  const [datosFormulario, setDatosFormulario] = useState<any>(null);
  const [obraEnEdicion, setObraEnEdicion] = useState<string | null>(null); // ID de la obra siendo editada

  // Estados para producciones
  const [esProduccion, setEsProduccion] = useState<boolean>(false);
  const [tituloProduccion, setTituloProduccion] = useState<string>('');

  const steps = esProduccion
    ? [
        { id: 'autores', nombre: 'Autores', numero: 1 },
        { id: 'producto', nombre: 'Tipo de Producción', numero: 2 },
        { id: 'produccion-datos', nombre: 'Datos Producción', numero: 3 },
        { id: 'carrito', nombre: 'Obras (6-15)', numero: 4 },
        { id: 'revision', nombre: 'Revisión', numero: 5 },
      ]
    : [
        { id: 'autores', nombre: 'Autores', numero: 1 },
        { id: 'carrito', nombre: 'Carrito de Obras', numero: 2 },
        { id: 'revision', nombre: 'Revisión', numero: 3 },
      ];

  // =========== HANDLERS DE NAVEGACIÓN ===========

  const handleAutoresCompleted = (autores: AutorSeleccionado[]) => {
    setAutoresSeleccionados(autores);
    setCurrentStep('carrito');
  };

  const handleAgregarObra = () => {
    // Resetear estados temporales
    setDatosFormulario(null);
    setObraEnEdicion(null);

    if (esProduccion) {
      // En modo producción, mantener el producto y ir directo al formulario
      setCurrentStep('formulario');
    } else {
      // En modo normal, resetear producto y volver a selector
      setProductoSeleccionado(null);
      setCurrentStep('producto');
    }
  };

  const handleProductoSelected = (producto: ProductoSeleccionado, isProduccion: boolean) => {
    setProductoSeleccionado(producto);
    setEsProduccion(isProduccion);

    if (isProduccion) {
      // Si es producción, ir a capturar datos de producción
      setCurrentStep('produccion-datos');
    } else {
      // Si no es producción, ir directo al formulario
      setCurrentStep('formulario');
    }
  };

  const handleDatosProduccionCompleted = (titulo: string) => {
    setTituloProduccion(titulo);
    // En producción, ir directo al formulario para llenar la primera obra
    setCurrentStep('formulario');
  };

  const handleFormularioCompleted = (datos: any) => {
    setDatosFormulario(datos);

    if (obraEnEdicion) {
      // Editar obra existente
      setObrasEnCarrito(prev =>
        prev.map(obra =>
          obra.id === obraEnEdicion
            ? { ...obra, producto: productoSeleccionado!, datosFormulario: datos }
            : obra
        )
      );
      setObraEnEdicion(null);
    } else {
      // Agregar nueva obra al carrito
      const nuevaObra: ObraEnCarrito = {
        id: crypto.randomUUID(), // Generar ID único temporal
        producto: productoSeleccionado!,
        datosFormulario: datos
      };
      setObrasEnCarrito(prev => [...prev, nuevaObra]);
    }

    // Volver al carrito
    // En modo producción, NO resetear el producto porque todas las obras son del mismo tipo
    if (!esProduccion) {
      setProductoSeleccionado(null);
    }
    setDatosFormulario(null);
    setCurrentStep('carrito');
  };

  const handleEditarObra = (obraId: string) => {
    const obra = obrasEnCarrito.find(o => o.id === obraId);
    if (obra) {
      setObraEnEdicion(obraId);
      setProductoSeleccionado(obra.producto);
      setDatosFormulario(obra.datosFormulario);
      setCurrentStep('formulario');
    }
  };

  const handleEliminarObra = (obraId: string) => {
    setObrasEnCarrito(prev => prev.filter(obra => obra.id !== obraId));
  };

  const handleContinuarDesdeCarrito = () => {
    setCurrentStep('revision');
  };

  const handleVolver = () => {
    if (currentStep === 'producto') {
      setProductoSeleccionado(null);
      setCurrentStep('carrito');
    } else if (currentStep === 'formulario') {
      setDatosFormulario(null);
      setCurrentStep('producto');
    } else if (currentStep === 'carrito') {
      setCurrentStep('autores');
    } else if (currentStep === 'revision') {
      setCurrentStep('carrito');
    }
  };

  const handleEnviar = async () => {
    try {
      if (obrasEnCarrito.length === 0) {
        alert('Error: No hay obras en el carrito');
        return;
      }

      if (esProduccion) {
        // ========== FLUJO DE PRODUCCIÓN ==========
        const response = await produccionesService.createProduccion({
          tituloProduccion,
          productoId: productoSeleccionado!.id,
          clientes: autoresSeleccionados.map(a => ({
            clienteId: a.cliente.id,
            tipoRelacion: a.rol
          })),
          obras: obrasEnCarrito.map((obra, index) => {
            // DEBUG: Ver QUÉ HAY en camposEspecificos
            console.log(`\n📝 OBRA ${index + 1} - Datos en carrito:`);
            console.log('camposEspecificos:', obra.datosFormulario.camposEspecificos);
            console.log('Claves:', Object.keys(obra.datosFormulario.camposEspecificos || {}));

            // Extraer campos del datosFormulario
            const campos = [];
            let tituloObra = `Obra ${index + 1}`;

            for (const [key, value] of Object.entries(obra.datosFormulario.camposEspecificos || {})) {
              console.log(`  Procesando: ${key} = ${value}`);

              if (key.startsWith('campo_')) {
                const campoId = parseInt(key.replace('campo_', ''));
                const valorStr = String(value || '');

                campos.push({
                  campoId,
                  valor: valorStr
                });

                console.log(`    ✅ Agregado campo ID ${campoId}: "${valorStr}"`);

                // Si es el campo de título, guardarlo aparte también
                if (key.includes('titulo')) {
                  tituloObra = valorStr;
                }
              } else {
                console.log(`    ⚠️  Clave NO empieza con 'campo_': ${key}`);
              }
            }

            // Si hay un campo 'titulo' explícito sin prefijo, usarlo
            if (obra.datosFormulario.camposEspecificos?.titulo) {
              tituloObra = obra.datosFormulario.camposEspecificos.titulo;
            }

            console.log(`  Título final: "${tituloObra}"`);
            console.log(`  Total campos a enviar: ${campos.length}`);

            return {
              titulo: tituloObra,
              campos
            };
          }),
          observaciones: ''
        });

        // Extraer produccion y obras de la respuesta
        const produccion = response.produccion;
        const obrasCreadas = response.obras;

        // Subir archivos de cada obra si existen
        console.log('📎 Subiendo archivos de obras de la producción...');
        console.log('Producción creada:', produccion);
        console.log('Obras creadas:', obrasCreadas);
        console.log(`Total obras creadas recibidas: ${obrasCreadas?.length || 0}`);

        // Validar que obrasCreadas existe y tiene contenido
        if (!obrasCreadas || obrasCreadas.length === 0) {
          console.error('❌ ERROR: No se recibieron obras creadas del backend');
          console.log('Response completa:', { produccion, obrasCreadas });
        } else {
          for (let i = 0; i < obrasEnCarrito.length; i++) {
            const obra = obrasEnCarrito[i];
            const archivos = obra.datosFormulario?.archivos;

            console.log(`\n━━━ Obra ${i + 1} ━━━`);
            console.log('  Datos en carrito:', {
              producto: obra.producto.nombre,
              tieneArchivos: !!archivos,
              cantidadArchivos: archivos?.length || 0
            });

            if (archivos && Array.isArray(archivos) && archivos.length > 0) {
              const obraCreada = obrasCreadas[i];

              console.log('  Obra creada del backend:', {
                id: obraCreada?.id,
                codigo: obraCreada?.codigo,
                tieneProductos: !!obraCreada?.productos,
                cantidadProductos: obraCreada?.productos?.length || 0
              });

              if (obraCreada && obraCreada.productos && obraCreada.productos.length > 0) {
                const formularioProductoId = obraCreada.productos[0].id;
                console.log(`  ✅ Iniciando subida de ${archivos.length} archivo(s)...`);
                console.log(`     FormularioId: ${obraCreada.id}`);
                console.log(`     FormularioProductoId: ${formularioProductoId}`);

                try {
                  const resultado = await formulariosService.uploadArchivos(
                    obraCreada.id,
                    archivos,
                    formularioProductoId
                  );
                  console.log(`  ✅ Archivos subidos exitosamente:`, resultado);
                } catch (error: any) {
                  console.error(`  ❌ Error subiendo archivos:`, {
                    mensaje: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                  });
                }
              } else {
                console.error('  ❌ Obra creada no tiene estructura de productos válida');
                console.log('     obraCreada completa:', JSON.stringify(obraCreada, null, 2));
              }
            } else {
              console.log('  ℹ️ No hay archivos para subir en esta obra');
            }
          }
        }
        console.log('\n✅ Proceso de subida de archivos completado');

        alert(
          `¡Producción creada exitosamente!\n\n` +
          `Título: ${tituloProduccion}\n` +
          `Código: ${produccion.codigo}\n` +
          `Total de obras: ${obrasEnCarrito.length}\n` +
          `Monto total: RD$ ${produccion.montoTotal}\n\n` +
          `La producción está en estado PENDIENTE_PAGO. Ahora debe dirigirse a Caja para realizar el pago.`
        );

        // Redirigir al dashboard de AAU
        navigate('/aau');
      } else {
        // ========== FLUJO NORMAL (sin producción) ==========
        const autores = autoresSeleccionados.map(a => ({
          clienteId: a.cliente.id,
          rol: a.rol
        }));

        const obras = obrasEnCarrito.map(obra => ({
          productoId: obra.producto.id,
          datosObra: {
            camposEspecificos: obra.datosFormulario.camposEspecificos || {}
          }
        }));

        // Llamar al backend con el nuevo endpoint
        const { formulario, totalObras, montoTotal } = await formulariosService.createFormularioObrasMultiple({
          autores,
          obras
        });

        // Subir archivos si existen
        for (const obra of obrasEnCarrito) {
          const archivos = obra.datosFormulario.archivos;
          if (archivos && archivos.length > 0) {
            // Encontrar el formularioProductoId correspondiente
            const productoCreado = formulario.productos.find((p: any) => p.productoId === obra.producto.id);

            if (productoCreado) {
              await formulariosService.uploadArchivos(formulario.id, archivos, productoCreado.id);
            }
          }
        }

        alert(
          `¡Formulario creado exitosamente!\n\n` +
          `Código: ${formulario.codigo}\n` +
          `Total de obras: ${totalObras}\n` +
          `Monto total: $${montoTotal.toFixed(2)}\n\n` +
          `El formulario está en estado PENDIENTE. Ahora debe dirigirse a Caja para realizar el pago.`
        );

        // Redirigir al dashboard de AAU
        navigate('/aau');
      }
    } catch (error: any) {
      console.error('Error al crear formulario:', error);
      alert(`Error al crear el formulario: ${getErrorMessage(error)}`);
    }
  };

  // =========== RENDER ===========

  // Obtener índice del paso actual para el progress bar
  const getCurrentStepIndex = () => {
    if (currentStep === 'autores') return 0;
    if (currentStep === 'carrito' || currentStep === 'producto' || currentStep === 'formulario') return 1;
    if (currentStep === 'revision') return 2;
    return 0;
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Nuevo Registro de Obra</h1>
              <p className="text-blue-100 mt-1">
                {obrasEnCarrito.length > 0
                  ? `${obrasEnCarrito.length} ${obrasEnCarrito.length === 1 ? 'obra' : 'obras'} en el carrito`
                  : 'Complete los pasos para registrar sus obras'}
              </p>
            </div>
            <button
              onClick={() => navigate('/aau')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelar
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mt-8">
            <div className="flex items-center">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center" style={{ flex: index < steps.length - 1 ? 1 : '0 0 auto' }}>
                  {/* Step Circle and Label */}
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all border-2 ${
                        currentStepIndex === index
                          ? 'bg-white text-blue-600 border-white shadow-lg scale-110'
                          : currentStepIndex > index
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white/10 text-white/60 border-white/30'
                      }`}
                    >
                      {currentStepIndex > index ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.numero
                      )}
                    </div>
                    <p
                      className={`text-sm font-semibold transition-all whitespace-nowrap ${
                        currentStepIndex === index
                          ? 'text-white'
                          : currentStepIndex > index
                          ? 'text-green-200'
                          : 'text-white/50'
                      }`}
                    >
                      {step.nombre}
                    </p>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="flex-1 px-4 pb-6">
                      <div
                        className={`h-1.5 w-full rounded-full transition-all ${
                          currentStepIndex > index
                            ? 'bg-green-500'
                            : 'bg-white/20'
                        }`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 'autores' && (
          <BusquedaAutoresStep
            autoresIniciales={autoresSeleccionados}
            onContinuar={handleAutoresCompleted}
          />
        )}

        {currentStep === 'producto' && (
          <SelectorProductoStep
            onProductoSeleccionado={handleProductoSelected}
            onVolver={handleVolver}
          />
        )}

        {currentStep === 'produccion-datos' && esProduccion && productoSeleccionado && (
          <DatosProduccionStep
            productoNombre={productoSeleccionado.nombre}
            tituloProduccionInicial={tituloProduccion}
            onContinue={handleDatosProduccionCompleted}
            onBack={() => setCurrentStep('producto')}
          />
        )}

        {currentStep === 'carrito' && (
          <CarritoObrasStep
            obrasEnCarrito={obrasEnCarrito}
            onAgregarObra={handleAgregarObra}
            onEditarObra={handleEditarObra}
            onEliminarObra={handleEliminarObra}
            onContinuar={handleContinuarDesdeCarrito}
            onVolver={handleVolver}
            esProduccion={esProduccion}
            tituloProduccion={tituloProduccion}
            precioProduccion={productoSeleccionado?.precio || 0}
          />
        )}

        {currentStep === 'formulario' && productoSeleccionado && (
          <FormularioObraStepDinamico
            producto={productoSeleccionado}
            datosIniciales={datosFormulario}
            onContinuar={handleFormularioCompleted}
            onVolver={handleVolver}
          />
        )}

        {currentStep === 'revision' && (
          <RevisionStep
            autores={autoresSeleccionados}
            obras={obrasEnCarrito}
            onEnviar={handleEnviar}
            onVolver={handleVolver}
            esProduccion={esProduccion}
            tituloProduccion={tituloProduccion}
            precioProduccion={productoSeleccionado?.precio || 0}
          />
        )}
      </div>
    </div>
  );
};

export default NuevoRegistroObraPage;
