import { useCallback, useMemo, useState } from "react";

import { ConfirmationDialog } from "@/components/shared/Dialogs";
import { FavoriteStar } from "@/components/shared/FavoriteStar";
import { useComponentLibrary } from "@/providers/ComponentLibraryProvider";
import type { ComponentReference } from "@/utils/componentSpec";
import { getComponentName } from "@/utils/getComponentName";

interface ComponentFavoriteToggleProps {
  component: ComponentReference;
}

export const ComponentFavoriteToggle = ({
  component,
}: ComponentFavoriteToggleProps) => {
  const {
    addToComponentLibrary,
    removeFromComponentLibrary,
    checkIfFavorited,
    checkIfUserComponent,
    checkLibraryContainsComponent,
    setComponentFavorite,
  } = useComponentLibrary();

  const [isOpen, setIsOpen] = useState(false);

  const { spec, url } = component;

  const isFavorited = useMemo(
    () => checkIfFavorited(component),
    [component, checkIfFavorited],
  );

  const isUserComponent = useMemo(
    () => checkIfUserComponent(component),
    [component, checkIfUserComponent],
  );

  const isInLibrary = useMemo(
    () => checkLibraryContainsComponent(component),
    [component, checkLibraryContainsComponent],
  );

  const displayName = useMemo(
    () => getComponentName({ spec, url }),
    [spec, url],
  );

  const onFavorite = useCallback(() => {
    setComponentFavorite(component, !isFavorited);
  }, [isFavorited, setComponentFavorite]);

  // Delete User Components
  const handleDelete = useCallback(async () => {
    removeFromComponentLibrary(component);
  }, [removeFromComponentLibrary]);

  /* Confirmation Dialog handlers */
  const openConfirmationDialog = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);

    if (!isInLibrary) {
      addToComponentLibrary(component);
      return;
    }

    handleDelete();
  }, [component, isInLibrary, addToComponentLibrary, handleDelete]);

  return (
    <>
      <FavoriteStar
        active={isFavorited}
        onClick={
          isUserComponent || !isInLibrary ? openConfirmationDialog : onFavorite
        }
      />
      <ConfirmationDialog
        isOpen={isOpen}
        title={
          !isInLibrary
            ? "Add to Component Library?"
            : "Delete custom component?"
        }
        description={
          !isInLibrary
            ? `This will add "${displayName}" to your Component Library for use in your pipelines.`
            : `"${displayName}" is a custom user component. Unstarring it will remove it from your library. This action cannot be undone.`
        }
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
};
