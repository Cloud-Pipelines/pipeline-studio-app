import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { ConfirmationDialog } from "@/components/shared/Dialogs";
import { FavoriteStar } from "@/components/shared/FavoriteStar";
import { useComponentLibrary } from "@/providers/ComponentLibraryProvider";
import type { ComponentReference } from "@/utils/componentSpec";
import { deleteComponentFileFromList } from "@/utils/componentStore";
import { USER_COMPONENTS_LIST_NAME } from "@/utils/constants";
import { getComponentName } from "@/utils/getComponentName";

interface ComponentFavoriteToggleProps {
  component: ComponentReference;
}

export const ComponentFavoriteToggle = ({
  component,
}: ComponentFavoriteToggleProps) => {
  const { checkIfFavorited, checkIfUserComponent, setComponentFavorite } =
    useComponentLibrary();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);

  const { name: fileName, spec, url } = component;

  const isFavorited = useMemo(
    () =>
      component.favorited !== undefined
        ? component.favorited
        : checkIfFavorited(component),
    [component, checkIfFavorited],
  );

  const isUserComponent = useMemo(
    () => checkIfUserComponent(component),
    [component, checkIfUserComponent],
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
    try {
      await deleteComponentFileFromList(
        USER_COMPONENTS_LIST_NAME,
        fileName ?? "",
      );
      queryClient.invalidateQueries({ queryKey: ["userComponents"] });
    } catch (error) {
      console.error("Error deleting component:", error);
    }
  }, [fileName, queryClient]);

  /* Confirmation Dialog handlers */
  const openConfirmationDialog = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    handleDelete();
    setIsOpen(false);
  }, [handleDelete]);

  return (
    <>
      <FavoriteStar
        active={isFavorited}
        onClick={isUserComponent ? openConfirmationDialog : onFavorite}
      />
      <ConfirmationDialog
        isOpen={isOpen}
        title="Delete custom component?"
        description={`"${displayName}" is a custom user component. Unstarring it will remove it from your library. This action cannot be undone.`}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
};
