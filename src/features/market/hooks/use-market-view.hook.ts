import { useFavorite } from '@/features/favorites/hooks/use-favorite.hook';
import { useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useMarketNft } from './use-market-nft.hook';

export function useMarketView() {
  const { nftId } = useParams({ from: '/market/$nftId' });
  const { isFavorite, toggleFavorite } = useFavorite(nftId);
  const nftQuery = useMarketNft(nftId);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedEditionId, setSelectedEditionId] = useState('standard');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');
  const images = nftQuery.data?.imageUrl ? [nftQuery.data.imageUrl] : [];
  const selectedEdition =
    nftQuery.data?.editions.find((edition) => edition.id === selectedEditionId) ??
    nftQuery.data?.editions[0];

  useEffect(() => {
    if (selectedEdition && selectedEdition.available > 0 && quantity > selectedEdition.available)
      setQuantity(selectedEdition.available);
  }, [selectedEdition, quantity]);

  return {
    nftId,
    nftQuery,
    images,
    selectedImage,
    setSelectedImage,
    selectedEdition,
    selectedEditionId: selectedEdition?.id ?? selectedEditionId,
    setSelectedEditionId,
    quantity,
    setQuantity,
    isFavorite,
    toggleFavorite,
    activeTab,
    setActiveTab,
  };
}
