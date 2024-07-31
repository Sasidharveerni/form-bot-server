const express = require('express');
const ConversationFlow = require('../models/formModel');
const Folder = require('../models/Folder');
const User = require('../models/user');

const router = express.Router();

// Get all flows
router.get('/get-flow', async (req, res) => {
  try {
    const flowData = await ConversationFlow.find();
    if (!flowData) {
      return res.status(400).json({
        status: 'Failed',
        message: 'Uh-Oh, there is no data. Create a form first.'
      });
    } else {
      return res.status(200).json({
        status: 'Success',
        data: flowData
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'Failed',
      error: error
    });
  }
});


router.get('/get-flow/:flowId', async (req, res) => {
  try {
    const {flowId} = req.params;
    const flowData = await ConversationFlow.findById(flowId);
    if (!flowData) {
      return res.status(400).json({
        status: 'Failed',
        message: 'Uh-Oh, there is no data. Create a form first.'
      });
    } else {
      return res.status(200).json({
        status: 'Success',
        data: flowData
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'Failed',
      error: error
    });
  }
});

router.delete('/delete-folder/:folderId', async (req, res) => {
  try {
    const { folderId } = req.params;

    const deletedFolder = await Folder.findByIdAndDelete(folderId);

    if (!deletedFolder) {
      return res.status(404).json({ status: 'Failed', message: 'Folder not found' });
    }

    res.json({ status: 'Success', message: 'Folder deleted successfully', folder: deletedFolder });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting folder', error: error.message });
  }
})

// Create a folder
router.post('/create-folder', async (req, res) => {
  try {
    const { name, creatorId } = req.body;

    const newFolder = new Folder({
      name,
      creator: creatorId
    });

    const savedFolder = await newFolder.save();

    // Update user's folders
    await User.findByIdAndUpdate(creatorId, { $push: { folders: savedFolder._id } });

    res.status(201).json({status: 'Success', message: 'Folder created successfully', folder: savedFolder });
  } catch (error) {
    res.status(500).json({status: 'Failed', message: 'Error creating folder', error: error.message });
  }
});

router.get('/get-folders/:creatorId', async (req, res) => {
  const { creatorId } = req.params;

  if (!creatorId) {
    return res.status(400).json({
      status: 'Failed',
      message: 'Creator ID is required'
    });
  }

  try {
    const folders = await Folder.find({ creator: creatorId }).populate('forms'); // Filter by creatorId and populate forms

    if (!folders || folders.length === 0) {
      return res.status(404).json({
        status: 'Failed',
        message: 'No folders found for this creator. Create a folder first.'
      });
    }

    res.status(200).json({
      status: 'Success',
      data: folders
    });
  } catch (error) {
    res.status(500).json({
      status: 'Failed',
      message: 'Error fetching folders',
      error: error.message
    });
  }
});


// Create a flow
router.post('/create-flow', async (req, res) => {
  try {
    const { name, steps, creatorId, folderId } = req.body;

    let parsedSteps;
    if (typeof steps === 'string') {
      try {
        parsedSteps = JSON.parse(steps);
      } catch (error) {
        return res.status(400).json({status: 'Failed', message: 'Invalid steps JSON', error: error.message });
      }
    } else {
      parsedSteps = steps;
    }

    const newFlow = new ConversationFlow({
      name,
      steps: parsedSteps,
      creator: creatorId
    });

    const savedFlow = await newFlow.save();

    // If the flow is inside a folder, update the folder's forms
    if (folderId) {
      await Folder.findByIdAndUpdate(folderId, { $push: { forms: savedFlow._id } });
    } else {
      // If the flow is standalone, update the user's flows
      await User.findByIdAndUpdate(creatorId, { $push: { flows: savedFlow._id } });
    }

    res.status(201).json({status: 'Success', message: 'Flow created successfully', flow: savedFlow });
  } catch (error) {
    res.status(500).json({status: 'Failed', message: 'Error creating flow', error: error.message });
  }
});

// Update a flow
router.put('/update-flow/:flowId', async (req, res) => {
  try {
    const { flowId } = req.params;
    const { name, steps } = req.body;

    console.log('Received flowId:', flowId);
    console.log('Received name:', name);
    console.log('Received steps:', steps);

    let parsedSteps;
    if (typeof steps === 'string') {
      try {
        parsedSteps = JSON.parse(steps);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid steps JSON', error: error.message });
      }
    } else {
      parsedSteps = steps;
    }

    const updatedFlow = await ConversationFlow.findByIdAndUpdate(
      flowId,
      { name, steps: parsedSteps, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!updatedFlow) {
      return res.status(404).json({status: 'Failed', message: 'Flow not found' });
    }

    res.json({status: 'Success', message: 'Flow updated successfully', flow: updatedFlow });
  } catch (error) {
    console.error('Error updating flow:', error);
    res.status(500).json({ message: 'Error updating flow', error: error.message });
  }
});


router.post('/post-response/:flowId', async (req, res) => {
  try {
    const { flowId } = req.params;
    const { updatedSteps } = req.body;

    // Parse the updatedSteps from the form-urlencoded data
    let parsedUpdatedSteps;
    if (typeof updatedSteps === 'string') {
      try {
        parsedUpdatedSteps = JSON.parse(updatedSteps);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid steps JSON', error: error.message });
      }
    } else {
      parsedUpdatedSteps = updatedSteps;
    }

    // Ensure parsedUpdatedSteps is an array
    if (!Array.isArray(parsedUpdatedSteps)) {
      throw new Error('updatedSteps should be an array');
    }

    // Parse and create humanResponse objects
    const humanResponses = parsedUpdatedSteps.map(step => ({
      step: step,
      updatedAt: Date.now()
    }));

    // Update the document by pushing the humanResponses
    const updatedFlow = await ConversationFlow.findByIdAndUpdate(
      flowId,
      { 
        $push: { humanResponses: { $each: humanResponses } }, 
        updatedAt: Date.now() 
      },
      { new: true, runValidators: true }
    );

    res.json({
      status: 'Success',
      message: 'Response recorded successfully',
      data: updatedFlow
    });
  } catch (error) {
    res.status(400).json({
      status: 'Failed',
      error: error.message
    });
  }
});


// Delete a flow
router.delete('/delete-flow/:flowId', async (req, res) => {
  try {
    const { flowId } = req.params;

    const deletedFlow = await ConversationFlow.findByIdAndDelete(flowId);

    if (!deletedFlow) {
      return res.status(404).json({status: 'Failed', message: 'Flow not found' });
    }

    res.json({status: 'Success', message: 'Flow deleted successfully', flow: deletedFlow });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting flow', error: error.message });
  }
});

// Update a step in a flow
router.patch('/update-step/:flowId/:stepId', async (req, res) => {
  try {
    const { flowId, stepId } = req.params;
    const { value } = req.body;

    const updatedFlow = await ConversationFlow.findOneAndUpdate(
      { _id: flowId, 'steps._id': stepId },
      { 
        $set: { 
          'steps.$.value': value,
          updatedAt: Date.now()
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedFlow) {
      return res.status(404).json({ message: 'Flow or step not found' });
    }

    const updatedStep = updatedFlow.steps.id(stepId);
    res.json({ message: 'Step updated successfully', step: updatedStep });
  } catch (error) {
    res.status(500).json({ message: 'Error updating step', error: error.message });
  }
});

module.exports = router;
