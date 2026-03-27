import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zipCode = searchParams.get('zipCode');

  if (!zipCode || zipCode.length !== 8) {
    return NextResponse.json({ message: 'CEP inválido' }, { status: 400 });
  }

  try {
    // Integração com Brasil API para validar o CEP e pegar o Estado (UF)
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${zipCode}`);

    if (!response.ok) {
      return NextResponse.json({ message: 'CEP não encontrado' }, { status: 404 });
    }

    const data = await response.json();
    const uf = data.state;

    // Lógica Mock Inteligente de Frete baseado na Região
    // Valores base fixos simulando uma loja em SP
    let pacPrice = 15.90;
    let pacDays = 5;
    let sedexPrice = 25.90;
    let sedexDays = 2;

    if (uf !== 'SP') {
      // Região Sul/Sudeste
      if (['RJ', 'MG', 'ES', 'PR', 'SC', 'RS'].includes(uf)) {
        pacPrice += 10;
        sedexPrice += 20;
        pacDays += 3;
        sedexDays += 1;
      }
      // Nordeste/Centro-Oeste/Norte
      else {
        pacPrice += 25;
        sedexPrice += 45;
        pacDays += 7;
        sedexDays += 3;
      }
    }

    return NextResponse.json({
      data: [
        {
          name: 'PAC',
          price: pacPrice.toFixed(2).replace('.', ','),
          deadline: pacDays,
        },
        {
          name: 'SEDEX',
          price: sedexPrice.toFixed(2).replace('.', ','),
          deadline: sedexDays,
        }
      ]
    });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao calcular frete' }, { status: 500 });
  }
}
