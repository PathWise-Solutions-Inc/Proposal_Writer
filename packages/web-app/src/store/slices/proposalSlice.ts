import { createSlice } from '@reduxjs/toolkit';

interface ProposalState {
  proposals: any[];
  currentProposal: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProposalState = {
  proposals: [],
  currentProposal: null,
  loading: false,
  error: null,
};

const proposalSlice = createSlice({
  name: 'proposal',
  initialState,
  reducers: {},
});

export default proposalSlice.reducer;