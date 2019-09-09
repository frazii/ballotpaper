use smart_contract_macros::smart_contract;
use smart_contract::log;
use smart_contract::payload::Parameters;
use std::collections::VecDeque;

struct Entry {
    sender: [u8; 32],
    message: String,
}

struct Vote {
    logs: VecDeque<Entry>,
    year: String,
    location: String,
    candidate1_name: String,
    candidate1_vote: u32,
    candidate2_name: String,
    candidate2_vote: u32,
    candidate3_name: String,
    candidate3_vote: u32,
    candidate4_name: String,
    candidate4_vote: u32,
    candidate5_name: String,
    candidate5_vote: u32
}

const MAX_LOG_CAPACITY: usize = 200;
const MAX_MESSAGE_SIZE: usize = 9; // e.g. 1,2,3,4,5

fn prune_old_votes(vote: &mut Vote) {
    if vote.logs.len() > MAX_LOG_CAPACITY {
        vote.logs.pop_front();
    }
}

fn convert_to_vote_points(param: u32) -> u32 {
    if param == 1
    {
        return 5
    }
    else if param == 2
    {
        return 4
    }
    else if param == 3
    {
        return 3
    }
    else if param == 4
    {
        return 2
    }
    else
    {
        return 1
    }
}


#[smart_contract]
impl Vote {
    fn init(_params: &mut Parameters) -> Self {
        Self {
            logs: VecDeque::new(),
            year: "2019".to_string(),
            location: "NORTH HUDSON".to_string(),

            candidate1_name: "AYIREBI, CECIL (LIBERAL)".to_string(),
            candidate1_vote: 0,

            candidate2_name: "BUTLER, DIONE (REPUBLICAN)".to_string(),
            candidate2_vote: 0,

            candidate3_name: "GARSIDE, CHARLES (LABOUR)".to_string(),
            candidate3_vote: 0,

            candidate4_name: "KING, STUART (DEMOCRATIC)".to_string(),
            candidate4_vote: 0,

            candidate5_name: "WHITWELL, FRANK (GREEN)".to_string(),
            candidate5_vote: 0
        }
    }

    fn is_vote_submitted(&mut self, _params: &mut Parameters) -> Result<(), String> {
        // Checking if the vote has already been made by the sender
        let mut record_found: u32 = 0;

        for entry_saved in &self.logs {
            if entry_saved.sender == _params.sender {
                record_found = 1;
                break;
            }
        }

        log(&record_found.to_string());
        Ok(())
    }

    fn send_vote(&mut self, params: &mut Parameters) -> Result<(), String> {
        let entry = Entry { sender: params.sender, message: params.read() };

        // Ensure that messages are not empty.
        if entry.message.len() == 0 {
             return Err("Message must not be empty.".to_string());
        }

        // Ensure that message are at most 9 characters.
        if entry.message.len() > MAX_MESSAGE_SIZE {
            return Err(format!("Message must not be more than {} characters.", MAX_MESSAGE_SIZE));
        }

        // calcuating vote points
        let vote_values: Vec<&str> = entry.message.split(",").collect();

        let temp = &vote_values[0];
        let vote_value = temp.parse::<u32>().unwrap();
        self.candidate1_vote = self.candidate1_vote + convert_to_vote_points(vote_value);

        let temp = &vote_values[1];
        let vote_value = temp.parse::<u32>().unwrap();
        self.candidate2_vote = self.candidate2_vote + convert_to_vote_points(vote_value);

        let temp = &vote_values[2];
        let vote_value = temp.parse::<u32>().unwrap();
        self.candidate3_vote = self.candidate3_vote + convert_to_vote_points(vote_value);

        let temp = &vote_values[3];
        let vote_value = temp.parse::<u32>().unwrap();
        self.candidate4_vote = self.candidate4_vote + convert_to_vote_points(vote_value);

        let temp = &vote_values[4];
        let vote_value = temp.parse::<u32>().unwrap();
        self.candidate5_vote = self.candidate5_vote + convert_to_vote_points(vote_value);

        // Push vote selections into logs.
        self.logs.push_back(entry);

        // Prune old messages if necessary.
        prune_old_votes(self);

        Ok(())
    }

    fn get_vote_year(&mut self, _params: &mut Parameters) -> Result<(), String> {
        log(&self.year);
        Ok(())
    }

    fn get_vote_location(&mut self, _params: &mut Parameters) -> Result<(), String> {
        log(&self.location);
        Ok(())
    }

    fn get_candidate1_name(&mut self, _params: &mut Parameters) -> Result<(), String> {
        log(&self.candidate1_name);
        Ok(())
    }

    fn get_candidate2_name(&mut self, _params: &mut Parameters) -> Result<(), String> {
        log(&self.candidate2_name);
        Ok(())
    }

    fn get_candidate3_name(&mut self, _params: &mut Parameters) -> Result<(), String> {
        log(&self.candidate3_name);
        Ok(())
    }

    fn get_candidate4_name(&mut self, _params: &mut Parameters) -> Result<(), String> {
        log(&self.candidate4_name);
        Ok(())
    }

    fn get_candidate5_name(&mut self, _params: &mut Parameters) -> Result<(), String> {
        log(&self.candidate5_name);
        Ok(())
    }

    fn get_candidate1_vote(&mut self, _params: &mut Parameters) -> Result<(), String> {
        log(&self.candidate1_vote.to_string());
        Ok(())
    }

    fn get_candidate2_vote(&mut self, _params: &mut Parameters) -> Result<(), String> {
        log(&self.candidate2_vote.to_string());
        Ok(())
    }

    fn get_candidate3_vote(&mut self, _params: &mut Parameters) -> Result<(), String> {
        log(&self.candidate3_vote.to_string());
        Ok(())
    }

    fn get_candidate4_vote(&mut self, _params: &mut Parameters) -> Result<(), String> {
        log(&self.candidate4_vote.to_string());
        Ok(())
    }

    fn get_candidate5_vote(&mut self, _params: &mut Parameters) -> Result<(), String> {
        log(&self.candidate5_vote.to_string());
        Ok(())
    }

}
