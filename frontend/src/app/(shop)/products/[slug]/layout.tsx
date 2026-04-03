import { Metadata } from 'next';

type Props = {
  params: { slug: string };
};

// Next.js Server-Side App Router API
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const API_URL = process.env.INTERNAL_API_URL || 'http://localhost:3001';

  try {
    // Busca dados no backend (isso roda no Node do Next.js)
    const res = await fetch(`${API_URL}/api/products/${params.slug}`, {
      next: { revalidate: 60 } // Cache por 60 segundos
    });

    if (!res.ok) {
      return { title: 'Produto não encontrado | E-commerce' };
    }

    const { data: product } = await res.json();

    // Fallback de imagens do array de upload local ou da String simples original
    const imageUrl = product?.images?.length > 0
      ? `${API_URL}${product.images[0].url}`
      : product?.imageUrl
        ? (product.imageUrl.startsWith('http') ? product.imageUrl : `${API_URL}${product.imageUrl}`)
        : '';

    return {
      title: `${product.name} | Loja Oficial`,
      description: product.description?.substring(0, 160) + '...',
      openGraph: {
        title: product.name,
        description: product.description?.substring(0, 160) + '...',
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/products/${product.slug}`,
        siteName: 'E-commerce',
        images: imageUrl ? [
          {
            url: imageUrl,
            width: 800,
            height: 600,
            alt: product.name,
          }
        ] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: product.description?.substring(0, 160) + '...',
        images: imageUrl ? [imageUrl] : [],
      },
    };
  } catch (error) {
    return { title: 'Produto | E-commerce' };
  }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
