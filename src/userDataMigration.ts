/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import localForage from "localforage";
import {
  type ComponentFileEntry,
  getAllComponentFilesFromList,
  unsafeWriteFilesToList,
} from "./componentStore";

const OLD_SITE_ORIGIN = "https://cloud-pipelines.github.io";
const NEW_SITE_ORIGIN = "https://cloud-pipelines.net";
const NEW_SITE_URL = new URL("pipeline-editor", NEW_SITE_ORIGIN).toString();
const VALID_MIGRATION_TARGET_ORIGINS = [
  OLD_SITE_ORIGIN,
  NEW_SITE_ORIGIN,
  "http://localhost:3000",
];
const SEND_MIGRATION_DATA_URL_PARAM = "send_migration_data";

const MIGRATION_SOURCE_ORIGIN = OLD_SITE_ORIGIN;

const DB_NAME = "components";
const COMPONENT_STORE_SETTINGS_DB_TABLE_NAME = "component_store_settings";
const MIGRATED_DATA_FROM_OLD_DOMAIN_SETTING_KEY =
  "Migrated components and pipelines from " + MIGRATION_SOURCE_ORIGIN;

interface Message {
  messageType: string;
}

interface UserFilesMessage extends Message {
  messageType: "FileMigrationMessage";
  pipelineFiles: ComponentFileEntry[];
  componentFiles: ComponentFileEntry[];
}

const isMessage = (obj: any): obj is Message =>
  typeof obj === "object" && "messageType" in obj;

const isFileMigrationMessage = (obj: any): obj is UserFilesMessage =>
  isMessage(obj) && obj.messageType === "FileMigrationMessage";

export const migrateUserData = async () => {
  const urlParams = new URL(document.location.href).searchParams;

  // Send the user data (pipelines and components) to the new website if requested.
  // Note: window.parent.location.origin or window.parent.origin cannot be accessed due to CORS.
  // DOMException: Blocked a frame with origin <iframe origin> from accessing a cross-origin frame.
  // So we get it from the request, but we cannot trust it.
  // We can still check it against the list and post the message to this origin if it's valid.
  const migrationTargetOrigin = urlParams.get(SEND_MIGRATION_DATA_URL_PARAM);
  if (migrationTargetOrigin !== null) {
    console.debug("migrateUserData: Preparing to send migration data");
    if (!VALID_MIGRATION_TARGET_ORIGINS.includes(migrationTargetOrigin)) {
      console.error(
        "migrateUserData: Invalid migration request origin:",
        migrationTargetOrigin
      );
      throw Error(
        `Invalid migration origin: ${migrationTargetOrigin}.` +
          `Supported origins: ${VALID_MIGRATION_TARGET_ORIGINS}`
      );
    }

    const componentFiles = Array.from(
      (await getAllComponentFilesFromList("user_components")).values()
    );
    const pipelineFiles = Array.from(
      (await getAllComponentFilesFromList("user_pipelines")).values()
    );
    const migrationDataMessage: UserFilesMessage = {
      messageType: "FileMigrationMessage",
      componentFiles: componentFiles,
      pipelineFiles: pipelineFiles,
    };
    console.debug(
      "migrateUserData: migrationDataMessage",
      migrationDataMessage
    );
    // It's safe to send messages to the origins that are in the valid origin list.
    window.parent.postMessage(migrationDataMessage, migrationTargetOrigin);
    console.debug("migrateUserData: After postMessage");
    return;
  } else if (window.location.origin === OLD_SITE_ORIGIN) {
    // We're on the old site and not inside the migration iframe.
    // Redirecting the user from old site to new site.
    window.location.replace(NEW_SITE_URL);
    return;
  }

  // Migrate the data from the old site if we have not already done it.
  const componentStoreSettingsDb = localForage.createInstance({
    name: DB_NAME,
    storeName: COMPONENT_STORE_SETTINGS_DB_TABLE_NAME,
  });
  const migratedDataMark = await componentStoreSettingsDb.getItem<Date>(
    MIGRATED_DATA_FROM_OLD_DOMAIN_SETTING_KEY
  );

  if (
    migratedDataMark === null &&
    window.location.origin !== MIGRATION_SOURCE_ORIGIN &&
    VALID_MIGRATION_TARGET_ORIGINS.includes(window.location.origin)
  ) {
    console.debug(
      `migrateUserData: Need to migrate data from ${MIGRATION_SOURCE_ORIGIN}.`
    );

    window.addEventListener("message", async (event) => {
      if (event.origin !== MIGRATION_SOURCE_ORIGIN) {
        console.error(
          "migrateUserData: Received message from unrecognized origin:",
          event
        );
        return;
      }
      if (!isFileMigrationMessage(event.data)) {
        console.error(
          "migrateUserData: Unexpected message data type: ",
          event.data
        );
        return;
      }
      const migrationDataMessage = event.data;
      console.log(
        "migrateUserData: Received files form old site: ",
        migrationDataMessage
      );

      await unsafeWriteFilesToList(
        "user_components",
        migrationDataMessage.componentFiles
      );
      await unsafeWriteFilesToList(
        "user_pipelines",
        migrationDataMessage.pipelineFiles
      );
      await componentStoreSettingsDb.setItem(
        MIGRATED_DATA_FROM_OLD_DOMAIN_SETTING_KEY,
        new Date()
      );

      console.log(
        "migrateUserData: Pipelines and components were successfully imported. The files will appear after page refresh."
      );
    });

    const migrationSourceIFrame = document.createElement("iframe");
    const migrationSourceUrl = new URL(
      "pipeline-editor",
      MIGRATION_SOURCE_ORIGIN
    );
    migrationSourceUrl.searchParams.append(
      SEND_MIGRATION_DATA_URL_PARAM,
      window.location.origin
    );
    migrationSourceIFrame.src = migrationSourceUrl.toString();
    migrationSourceIFrame.name = "migration_iframe";
    migrationSourceIFrame.title = "Migration source";
    migrationSourceIFrame.style.display = "none";
    document.body.appendChild(migrationSourceIFrame);
  }
};
