/**  Copyright (c) 2013, OJC Technologies Limited
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met: 

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer. 
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution. 

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

The views and conclusions contained in the software and documentation are those
of the authors and should not be interpreted as representing official policies, 
either expressed or implied, of the FreeBSD Project.

**/

/** GLOBALS **/
var processedLabel = GmailApp.getUserLabelByName('Processed');
var autoUploadLabel = GmailApp.getUserLabelByName('Upload to Google Drive');
var uploadLabelPrefix = 'Location: ';


/**
 * Entry point for the auto upload.
 */
function processAutoUploadMessages() {
  var threads = autoUploadLabel.getThreads();
  for (var i = 0; i < threads.length; i++) {
    if (hasThreadBeenProcessed(threads[i])) {
      Logger.log('Message thread %s already processed.', threads[i].getId());
      continue;
    }
    var uploadFolder = getUploadPathFromLabel(threads[i]);
    var messages = threads[i].getMessages();
    for (var j = 0; j < messages.length; j++) {
      Logger.log('Processing message %s.', messages[j].getId());
      processMessageAttachments(messages[j], uploadFolder);
    }
  }
};

/**
 * Function to determine if a message thread has been processed by the script.
 */
function hasThreadBeenProcessed(thread) {
  var labels = thread.getLabels();
  for (var i =0; i < labels.length; i++) {
    if (labels[i].getName() == processedLabel.getName()) {
      return true;
    }
  }
  return false;
}

/**
 * Returns an upload path based on a label set on a mail item.
 * Label prefix is defined in global uploadLabelPrefix.
 */
function getUploadPathFromLabel(thread) {
  var threadLabels = thread.getLabels();
  for (var i = 0; i < threadLabels.length; i++) {
    if (threadLabels[i].getName().indexOf(uploadLabelPrefix) != -1) {
      // Found the upload label - now to parse the result.
      var labelName = threadLabels[i].getName();
      var uploadPath = labelName.slice(uploadLabelPrefix.length, labelName.length);
      Logger.log('Got upload path %s from label.', uploadPath);
      return uploadPath;
    }
  }
  Logger.log('Label not found. Using default upload path.');
  return 'upload';
};

/**
 * Processes message attachments and uploads them to the folder specified.
 */
function processMessageAttachments(message, folderToUpload) {  
  var attachments = message.getAttachments();
  if (attachments.length != 0) {
    Logger.log('Message %s has %s attachments.', message.getId(), attachments.length);
    Logger.log('Uploading blob to folder');
    for (var i = 0; i < attachments.length; i++) {
      var d = message.getDate();
      var formattedDate = d.getFullYear() + '.' + d.getMonth() + '.' + d.getDate();
      uploadBlobToFolder(attachments[i].copyBlob(), formattedDate + ' - ' + attachments[i].getName(), folderToUpload);
    }
  }
  else {
    Logger.log('Message %s has no attachments.', message.getId());
  }
  Logger.log('Adding label %s', processedLabel.getName());
  message.getThread().addLabel(processedLabel);
};

/**
 * Uploads a blob to a Google Drive folder with a specified name.
 */
function uploadBlobToFolder(blob, name, folderPath) {
  var folder = DocsList.getFolder(folderPath);
  Logger.log('Uploading to folder %s as %s', folderPath, name);
  var file = folder.createFile(blob);
  file.rename(name);
};

