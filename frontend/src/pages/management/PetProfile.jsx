import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { FaTrash, FaEdit, FaPaw, FaEye } from 'react-icons/fa';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';
import PetAvatar from '../../components/PetAvatar';
import GenderSelector from '../../components/GenderSelector';
import GenderIcon from '../../components/GenderIcon';
import FormInput from '../../components/FormInput';
import FormSelect from '../../components/FormSelect';
import { formatAge } from '../../utils/formatters';
import managementBg from '../../assets/Management.png';
import {
  fetchPets as fetchPetsAPI,
  fetchNormalUsers as fetchNormalUsersAPI,
  createPet,
  updatePet,
  deletePet,
} from '../../services/petService';

export default function PetProfile() {
  const { token } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [form, setForm] = useState({
    owner: '',
    pet_picture: null,
    pet_name: '',
    breed: '',
    branch: 'Matina',
    age_value: '',
    age_unit: 'months',
    birthdate: '',
    gender: '',
    weight_lbs: '',
    additional_notes: '',
  });
  const [pets, setPets] = useState([]);
  const [normalUsers, setNormalUsers] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewPet, setViewPet] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [confirmEditDialog, setConfirmEditDialog] = useState({ isOpen: false, pet: null });
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState({ isOpen: false, petId: null });

  useEffect(() => {
    loadPets();
    loadNormalUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNormalUsers = async () => {
    try {
      const data = await fetchNormalUsersAPI(token);
      setNormalUsers(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch users.', 'error');
    }
  };

  const loadPets = async () => {
    setLoading(true);
    try {
      const data = await fetchPetsAPI(token);
      setPets(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch pets.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.owner) e.owner = 'Owner is required';
    if (!form.pet_name.trim()) e.pet_name = 'Pet name is required';
    if (!form.breed.trim()) e.breed = 'Breed is required';
    if (!form.age_value || isNaN(Number(form.age_value)) || Number(form.age_value) <= 0)
      e.age_value = 'Age must be a positive number';
    if (!form.birthdate) e.birthdate = 'Birthdate is required';
    if (!form.gender) e.gender = 'Gender is required';
    if (!form.weight_lbs || isNaN(Number(form.weight_lbs)) || Number(form.weight_lbs) <= 0)
      e.weight_lbs = 'Weight must be a positive number';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({ ...prev, pet_picture: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGenderSelect = (gender) => {
    setForm((prev) => ({ ...prev, gender }));
  };

  const handleAddPet = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    try {
      const formData = new FormData();
      formData.append('owner', form.owner);
      if (form.pet_picture) formData.append('pet_picture', form.pet_picture);
      formData.append('pet_name', form.pet_name.trim());
      formData.append('breed', form.breed.trim());
      formData.append('branch', form.branch);
      formData.append('age_value', form.age_value);
      formData.append('age_unit', form.age_unit);
      formData.append('birthdate', form.birthdate);
      formData.append('gender', form.gender);
      formData.append('weight_lbs', form.weight_lbs);
      formData.append('additional_notes', form.additional_notes.trim());

      await createPet(formData, token);

      showToast('Pet profile added successfully!', 'success');
      resetForm();
      loadPets();
    } catch (err) {
      console.error(err);
      showToast('Failed to add pet profile.', 'error');
    }
  };

  const resetForm = () => {
    setForm({
      owner: '',
      pet_picture: null,
      pet_name: '',
      breed: '',
      branch: 'Matina',
      age_value: '',
      age_unit: 'months',
      birthdate: '',
      gender: '',
      weight_lbs: '',
      additional_notes: '',
    });
    setImagePreview(null);
    setErrors({});
  };

  const handleView = (pet) => {
    setViewPet(pet);
    setShowViewModal(true);
  };

  const handleEdit = (pet) => {
    setEditForm({
      ...pet,
      pet_picture: null, // Reset file input
    });
    setEditImagePreview(pet.pet_picture);
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditForm((prev) => ({ ...prev, pet_picture: file }));
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const handleEditGenderSelect = (gender) => {
    setEditForm((prev) => ({ ...prev, gender }));
  };

  const saveEdit = async () => {
    try {
      const formData = new FormData();
      formData.append('owner', editForm.owner);
      if (editForm.pet_picture && typeof editForm.pet_picture !== 'string') {
        formData.append('pet_picture', editForm.pet_picture);
      }
      formData.append('pet_name', editForm.pet_name);
      formData.append('breed', editForm.breed);
      formData.append('branch', editForm.branch);
      formData.append('age_value', editForm.age_value);
      formData.append('age_unit', editForm.age_unit);
      formData.append('birthdate', editForm.birthdate);
      formData.append('gender', editForm.gender);
      formData.append('weight_lbs', editForm.weight_lbs);
      formData.append('additional_notes', editForm.additional_notes || '');

      await updatePet(editForm.id, formData, token);

      showToast('Pet profile updated successfully!', 'success');
      setShowEditModal(false);
      setEditForm(null);
      setEditImagePreview(null);
      setConfirmEditDialog({ isOpen: false, pet: null });
      loadPets();
    } catch (err) {
      console.error(err);
      showToast('Failed to update pet profile.', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePet(id, token);
      showToast('Pet profile deleted successfully!', 'success');
      loadPets();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete pet profile.', 'error');
    } finally {
      setConfirmDeleteDialog({ isOpen: false, petId: null });
    }
  };

  return (
    <div className="p-6 min-h-screen bg-accent-cream bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${managementBg})` }}>
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header with Pet Gallery Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pet Profile Management</h1>
        <button
          onClick={() => setShowGalleryModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center gap-2"
        >
          <FaPaw />
          Pet Gallery
        </button>
      </div>

      {/* Centered Add Pet Form */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Add Pet Profile</h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Pet Picture */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Pet Picture</label>
              <div className="flex items-center gap-4">
                <PetAvatar imageUrl={imagePreview} size="medium" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Owner Dropdown */}
            <FormSelect
              label="Owner"
              name="owner"
              value={form.owner}
              onChange={handleChange}
              options={normalUsers.map((user) => ({
                value: user.id,
                label: `${user.username} (${user.first_name} ${user.last_name})`,
              }))}
              placeholder="-- Select Owner --"
              error={errors.owner}
              required
              className="col-span-2"
            />

            {/* Pet Name */}
            <FormInput
              label="Pet Name"
              name="pet_name"
              value={form.pet_name}
              onChange={handleChange}
              placeholder="e.g., Buddy"
              error={errors.pet_name}
              required
            />

            {/* Breed */}
            <FormInput
              label="Breed"
              name="breed"
              value={form.breed}
              onChange={handleChange}
              placeholder="e.g., Golden Retriever"
              error={errors.breed}
              required
            />

            {/* Branch */}
            <FormSelect
              label="Branch"
              name="branch"
              value={form.branch}
              onChange={handleChange}
              options={[
                { value: 'Matina', label: 'Matina' },
                { value: 'Toril', label: 'Toril' },
              ]}
              error={errors.branch}
              required
              className="col-span-2"
            />

            {/* Age */}
            <div>
              <label className="block text-sm font-medium">Age</label>
              <div className="flex gap-2 mt-1">
                <input
                  name="age_value"
                  value={form.age_value}
                  onChange={handleChange}
                  className="flex-1 border rounded px-3 py-2"
                  placeholder="e.g., 3"
                  type="number"
                  min="1"
                />
                <select
                  name="age_unit"
                  value={form.age_unit}
                  onChange={handleChange}
                  className="border rounded px-3 py-2"
                >
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
              {errors.age_value && <div className="text-red-600 text-sm mt-1">{errors.age_value}</div>}
            </div>

            {/* Birthdate */}
            <FormInput
              label="Birthdate"
              name="birthdate"
              type="date"
              value={form.birthdate}
              onChange={handleChange}
              error={errors.birthdate}
              required
            />

            {/* Gender */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">
                Gender<span className="text-red-500 ml-1">*</span>
              </label>
              <GenderSelector value={form.gender} onChange={handleGenderSelect} />
              {errors.gender && <div className="text-red-600 text-sm mt-1">{errors.gender}</div>}
            </div>

            {/* Weight */}
            <FormInput
              label="Weight (lbs)"
              name="weight_lbs"
              type="number"
              value={form.weight_lbs}
              onChange={handleChange}
              placeholder="e.g., 50.5"
              step="0.1"
              min="0.1"
              error={errors.weight_lbs}
              required
              className="col-span-2"
            />

            {/* Additional Notes */}
            <div className="col-span-2">
              <label className="block text-sm font-medium">Additional Notes (Optional)</label>
              <textarea
                name="additional_notes"
                value={form.additional_notes}
                onChange={handleChange}
                rows={2}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="Any special notes about the pet..."
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={handleAddPet} className="flex-1 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
              Add Pet Profile
            </button>
            <button
              onClick={resetForm}
              className="flex-1 bg-gray-200 px-6 py-2 rounded hover:bg-gray-300"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Pet Gallery Modal */}
      <Modal
        isOpen={showGalleryModal}
        onClose={() => setShowGalleryModal(false)}
        title="Pet Gallery"
        maxWidth="max-w-6xl"
      >
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : pets.length === 0 ? (
          <div className="text-center text-gray-500">No pet profiles yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pets.map((pet) => (
              <div key={pet.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center">
                  <PetAvatar imageUrl={pet.pet_picture} size="large" className="mb-3" />
                  <div className="text-center w-full">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{pet.pet_name}</h3>
                      <GenderIcon gender={pet.gender} />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{pet.breed}</p>
                    <p className="text-xs text-gray-500 mb-2">
                      Owner: {pet.owner_details?.username} | Branch: {pet.branch}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      Age: {formatAge(pet.age_value, pet.age_unit)} | Weight: {pet.weight_lbs} lbs
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          setShowGalleryModal(false);
                          handleView(pet);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-2"
                        title="View Details"
                      >
                        <FaEye size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setShowGalleryModal(false);
                          handleEdit(pet);
                        }}
                        className="text-green-600 hover:text-green-800 p-2"
                        title="Edit"
                      >
                        <FaEdit size={18} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteDialog({ isOpen: true, petId: pet.id })}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="Delete"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal && editForm}
        onClose={() => {
          setShowEditModal(false);
          setEditForm(null);
          setEditImagePreview(null);
        }}
        title="Edit Pet Profile"
        maxWidth="max-w-2xl"
      >
        {editForm && (
          <>
            <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {/* Pet Picture */}
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Pet Picture</label>
                <div className="flex items-center gap-4">
                  <PetAvatar imageUrl={editImagePreview} size="medium" />
                  <input type="file" accept="image/*" onChange={handleEditImageChange} className="text-sm" />
                </div>
              </div>

              {/* Owner */}
              <FormSelect
                label="Owner"
                name="owner"
                value={editForm.owner}
                onChange={handleEditChange}
                options={normalUsers.map((user) => ({
                  value: user.id,
                  label: `${user.username} (${user.first_name} ${user.last_name})`,
                }))}
                className="col-span-2"
              />

              {/* Pet Name */}
              <FormInput
                label="Pet Name"
                name="pet_name"
                value={editForm.pet_name}
                onChange={handleEditChange}
              />

              {/* Breed */}
              <FormInput
                label="Breed"
                name="breed"
                value={editForm.breed}
                onChange={handleEditChange}
              />

              {/* Branch */}
              <FormSelect
                label="Branch"
                name="branch"
                value={editForm.branch}
                onChange={handleEditChange}
                options={[
                  { value: 'Matina', label: 'Matina' },
                  { value: 'Toril', label: 'Toril' },
                ]}
                className="col-span-2"
              />

              {/* Age */}
              <div>
                <label className="block text-sm font-medium">Age</label>
                <div className="flex gap-2 mt-1">
                  <input
                    name="age_value"
                    value={editForm.age_value}
                    onChange={handleEditChange}
                    className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="number"
                    min="1"
                  />
                  <select
                    name="age_unit"
                    value={editForm.age_unit}
                    onChange={handleEditChange}
                    className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>

              {/* Birthdate */}
              <FormInput
                label="Birthdate"
                name="birthdate"
                type="date"
                value={editForm.birthdate}
                onChange={handleEditChange}
              />

              {/* Gender */}
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Gender</label>
                <GenderSelector value={editForm.gender} onChange={handleEditGenderSelect} />
              </div>

              {/* Weight */}
              <FormInput
                label="Weight (lbs)"
                name="weight_lbs"
                type="number"
                value={editForm.weight_lbs}
                onChange={handleEditChange}
                step="0.1"
                min="0.1"
                className="col-span-2"
              />

              {/* Additional Notes */}
              <div className="col-span-2">
                <label className="block text-sm font-medium">Additional Notes</label>
                <textarea
                  name="additional_notes"
                  value={editForm.additional_notes || ''}
                  onChange={handleEditChange}
                  rows={2}
                  className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditForm(null);
                  setEditImagePreview(null);
                }}
                className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button onClick={() => setConfirmEditDialog({ isOpen: true, pet: editForm })} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Save Changes
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* View Pet Details Modal */}
      <Modal
        isOpen={showViewModal && viewPet}
        onClose={() => {
          setShowViewModal(false);
          setViewPet(null);
        }}
        title="Pet Profile Details"
        maxWidth="max-w-2xl"
      >
        {viewPet && (
          <div className="space-y-4">
            {/* Pet Picture */}
            <div className="flex justify-center mb-4">
              <PetAvatar imageUrl={viewPet.pet_picture} size="large" />
            </div>

            {/* Pet Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Pet Name</label>
                <p className="text-base font-semibold mt-1">{viewPet.pet_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Gender</label>
                <div className="flex items-center gap-2 mt-1">
                  <GenderIcon gender={viewPet.gender} size={20} />
                  <p className="text-base font-semibold capitalize">{viewPet.gender}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Breed</label>
                <p className="text-base font-semibold mt-1">{viewPet.breed}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Branch</label>
                <p className="text-base font-semibold mt-1">{viewPet.branch}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Age</label>
                <p className="text-base font-semibold mt-1">{formatAge(viewPet.age_value, viewPet.age_unit)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Birthdate</label>
                <p className="text-base font-semibold mt-1">{new Date(viewPet.birthdate).toLocaleDateString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Weight</label>
                <p className="text-base font-semibold mt-1">{viewPet.weight_lbs} lbs</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Owner</label>
                <p className="text-base font-semibold mt-1">
                  {viewPet.owner_details?.username} ({viewPet.owner_details?.first_name} {viewPet.owner_details?.last_name})
                </p>
              </div>

              {viewPet.additional_notes && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-600">Additional Notes</label>
                  <p className="text-base mt-1 text-gray-700 whitespace-pre-wrap">{viewPet.additional_notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewPet(null);
                }}
                className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={confirmEditDialog.isOpen}
        title="Save Changes"
        message="Are you sure you want to save changes?"
        onConfirm={saveEdit}
        onCancel={() => setConfirmEditDialog({ isOpen: false, pet: null })}
      />
      
      <ConfirmDialog
        isOpen={confirmDeleteDialog.isOpen}
        title="Delete Pet Profile"
        message="Are you sure you want to delete this pet profile?"
        onConfirm={() => handleDelete(confirmDeleteDialog.petId)}
        onCancel={() => setConfirmDeleteDialog({ isOpen: false, petId: null })}
      />
    </div>
  );
}
